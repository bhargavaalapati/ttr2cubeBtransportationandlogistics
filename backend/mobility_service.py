"""Provider adapters for place search and route planning.

Google Maps is preferred when a billed key is available. Photon and OSRM are
low-volume, best-effort OpenStreetMap fallbacks for the hackathon demo.
"""

import os
from typing import Any

import httpx


HYDERABAD_BBOX = "78.20,17.20,78.70,17.65"
REQUEST_HEADERS = {"User-Agent": "BoardWiseHackathon/1.0 (contact: team@boardwise.local)"}
HYDERABAD_PLACES = [
    ("Ameerpet", "Ameerpet, Hyderabad, Telangana", 17.4375, 78.4482),
    ("HITEC City", "HITEC City, Madhapur, Hyderabad, Telangana", 17.4435, 78.3772),
    ("Gachibowli", "Gachibowli, Hyderabad, Telangana", 17.4401, 78.3489),
    ("Miyapur", "Miyapur, Hyderabad, Telangana", 17.4968, 78.3614),
    ("Koti", "Koti, Hyderabad, Telangana", 17.3854, 78.4867),
    ("Secunderabad", "Secunderabad, Telangana", 17.4399, 78.4983),
    ("Kukatpally", "Kukatpally, Hyderabad, Telangana", 17.4849, 78.4138),
    ("Patancheru", "Patancheru, Hyderabad, Telangana", 17.5332, 78.2656),
    ("Charminar", "Charminar, Hyderabad, Telangana", 17.3616, 78.4747),
    ("Rajiv Gandhi International Airport", "Shamshabad, Hyderabad, Telangana", 17.2403, 78.4294),
    ("Dilsukhnagar", "Dilsukhnagar, Hyderabad, Telangana", 17.3688, 78.5247),
    ("LB Nagar", "LB Nagar, Hyderabad, Telangana", 17.3497, 78.5503),
    ("Nampally", "Nampally, Hyderabad, Telangana", 17.3936, 78.4653),
    ("Banjara Hills", "Banjara Hills, Hyderabad, Telangana", 17.4156, 78.4347),
    ("Jubilee Hills", "Jubilee Hills, Hyderabad, Telangana", 17.4326, 78.4071),
    ("Begumpet", "Begumpet, Hyderabad, Telangana", 17.4435, 78.4623),
]


class MobilityProviderError(Exception):
    """Raised when no supported provider can return a verified result."""


def _google_key() -> str | None:
    return os.getenv("GOOGLE_MAPS_API_KEY") or os.getenv("GOOGLE_MAPS_DEMO_KEY")


def _to_place(name: str, address: str, latitude: float, longitude: float, provider: str) -> dict[str, Any]:
    return {
        "name": name,
        "address": address,
        "latitude": latitude,
        "longitude": longitude,
        "provider": provider,
    }


async def search_places(query: str) -> list[dict[str, Any]]:
    """Search Hyderabad places using Google Places, then Photon if unavailable."""
    normalized_query = query.strip().casefold().replace("hitech", "hitec")
    local_results = [
        _to_place(name, address, latitude, longitude, "BoardWise Hyderabad directory")
        for name, address, latitude, longitude in HYDERABAD_PLACES
        if normalized_query in name.casefold() or normalized_query in address.casefold()
    ]
    if local_results:
        return local_results[:5]

    key = _google_key()
    if key:
        try:
            async with httpx.AsyncClient(timeout=8) as client:
                response = await client.post(
                    "https://places.googleapis.com/v1/places:searchText",
                    headers={
                        **REQUEST_HEADERS,
                        "Content-Type": "application/json",
                        "X-Goog-Api-Key": key,
                        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location",
                    },
                    json={"textQuery": f"{query}, Hyderabad, Telangana, India", "maxResultCount": 5},
                )
                response.raise_for_status()
            places = response.json().get("places", [])
            results = [
                _to_place(
                    place.get("displayName", {}).get("text", "Unknown place"),
                    place.get("formattedAddress", "Hyderabad, Telangana"),
                    place["location"]["latitude"],
                    place["location"]["longitude"],
                    "Google Places",
                )
                for place in places
                if place.get("location")
            ]
            if results:
                return results
        except (httpx.HTTPError, KeyError, TypeError):
            # A demo/unbilled Google key is expected to fail. Use the fallback.
            pass

    try:
        async with httpx.AsyncClient(timeout=8) as client:
            response = await client.get(
                "https://photon.komoot.io/api/",
                params={"q": f"{query}, Hyderabad", "limit": 5, "bbox": HYDERABAD_BBOX, "lang": "en"},
                headers=REQUEST_HEADERS,
            )
            response.raise_for_status()
        results = []
        for feature in response.json().get("features", []):
            properties = feature.get("properties", {})
            coordinates = feature.get("geometry", {}).get("coordinates", [])
            if len(coordinates) < 2:
                continue
            name = properties.get("name") or properties.get("street") or "Hyderabad location"
            address_parts = [properties.get(key) for key in ("street", "district", "city", "state")]
            address = ", ".join(dict.fromkeys(part for part in address_parts if part)) or "Hyderabad, Telangana"
            results.append(_to_place(name, address, coordinates[1], coordinates[0], "OpenStreetMap / Photon"))
        return results
    except httpx.HTTPError as error:
        raise MobilityProviderError("Place search is unavailable. Check the network connection and try again.") from error


async def road_route(origin: dict[str, Any], destination: dict[str, Any]) -> dict[str, Any]:
    """Get a real driving route from OSRM when Google Routes is unavailable."""
    coordinates = f"{origin['longitude']},{origin['latitude']};{destination['longitude']},{destination['latitude']}"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                f"https://router.project-osrm.org/route/v1/driving/{coordinates}",
                params={"overview": "false"},
                headers=REQUEST_HEADERS,
            )
            response.raise_for_status()
        route = response.json().get("routes", [])[0]
        return {
            "distance_meters": round(route["distance"]),
            "duration_seconds": round(route["duration"]),
            "provider": "OSRM / OpenStreetMap",
        }
    except (httpx.HTTPError, IndexError, KeyError) as error:
        raise MobilityProviderError("Road route data is unavailable. Please try again.") from error


async def google_transit_routes(origin: dict[str, Any], destination: dict[str, Any]) -> list[dict[str, Any]]:
    """Return Google transit results or an empty list when the key/provider cannot serve them."""
    key = _google_key()
    if not key:
        return []
    body = {
        "origin": {"location": {"latLng": {"latitude": origin["latitude"], "longitude": origin["longitude"]}}},
        "destination": {"location": {"latLng": {"latitude": destination["latitude"], "longitude": destination["longitude"]}}},
        "travelMode": "TRANSIT",
        "languageCode": "en-IN",
        "units": "METRIC",
    }
    field_mask = "routes.duration,routes.distanceMeters,routes.localizedValues,routes.legs.steps.travelMode,routes.legs.steps.transitDetails"
    try:
        async with httpx.AsyncClient(timeout=12) as client:
            response = await client.post(
                "https://routes.googleapis.com/directions/v2:computeRoutes",
                headers={**REQUEST_HEADERS, "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": field_mask},
                json=body,
            )
            response.raise_for_status()
        return response.json().get("routes", [])
    except httpx.HTTPError:
        return []
