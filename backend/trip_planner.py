"""Transforms verified mapping-provider responses into BoardWise trip options."""

from typing import Any


def _minutes(seconds: int | str | None) -> int:
    if isinstance(seconds, str):
        seconds = int(seconds.removesuffix("s"))
    return max(1, round((seconds or 0) / 60))


def _mode_from_google_route(route: dict[str, Any]) -> tuple[str, list[str]]:
    modes: list[str] = []
    for step in route.get("legs", [{}])[0].get("steps", []):
        mode = step.get("travelMode")
        if mode and mode not in modes:
            modes.append(mode)
    transit_modes = [mode.title() for mode in modes if mode not in {"WALK", "DRIVE"}]
    return (" + ".join(transit_modes) or "Transit"), modes


def _transit_steps(route: dict[str, Any]) -> list[str]:
    steps = []
    for step in route.get("legs", [{}])[0].get("steps", []):
        details = step.get("transitDetails") or {}
        line = details.get("transitLine", {})
        name = line.get("nameShort") or line.get("name") or step.get("travelMode")
        if name:
            steps.append(name)
    return steps


def build_trip_plan(
    origin: dict[str, Any],
    destination: dict[str, Any],
    road: dict[str, Any],
    transit_routes: list[dict[str, Any]],
    boardwise_scores: dict[str, Any],
) -> dict[str, Any]:
    options: list[dict[str, Any]] = []
    for index, route in enumerate(transit_routes):
        mode, modes = _mode_from_google_route(route)
        localized = route.get("localizedValues", {})
        fare = localized.get("transitFare")
        steps = _transit_steps(route)
        route_text = " ".join(steps).upper()
        bcs = boardwise_scores if "218D" in route_text else None
        options.append({
            "id": f"google-transit-{index}",
            "mode": mode,
            "duration_min": _minutes(route.get("duration")),
            "distance_km": round(route.get("distanceMeters", 0) / 1000, 1),
            "fare": fare.get("units") if fare else None,
            "currency": fare.get("currencyCode", "INR") if fare else None,
            "fare_type": "provider fare" if fare else "fare unavailable from provider",
            "reliability": 92 if "RAIL" in modes or "SUBWAY" in modes else 75,
            "steps": steps,
            "provider": "Google Routes",
            "boardwise": bcs,
        })

    # Real road-route distance/ETA. No fare is fabricated for private modes.
    options.append({
        "id": "road-route",
        "mode": "Road route",
        "duration_min": _minutes(road["duration_seconds"]),
        "distance_km": round(road["distance_meters"] / 1000, 1),
        "fare": None,
        "currency": "INR",
        "fare_type": "No live cab/auto partner connected",
        "reliability": 80,
        "steps": ["Drive / auto / cab"],
        "provider": road["provider"],
        "boardwise": None,
    })

    transit_options = [option for option in options if option["id"].startswith("google-transit")]
    candidates = transit_options or options

    def recommendation_cost(option: dict[str, Any]) -> float:
        action = (option.get("boardwise") or {}).get("action")
        boarding_penalty = {"SWITCH": 20, "WAIT": 8}.get(action, 0)
        return option["duration_min"] + boarding_penalty

    recommendation = min(candidates, key=recommendation_cost)
    recommendation_reason = "Quickest verified option available from connected providers."
    if (recommendation.get("boardwise") or {}).get("action") == "SWITCH":
        recommendation_reason = "Avoids a route with low current boarding confidence."
    elif (recommendation.get("boardwise") or {}).get("action") == "WAIT":
        recommendation_reason = "Balances journey time with moderate boarding confidence."
    evidence = [
        {
            "label": "Route duration",
            "value": f"{recommendation['duration_min']} minutes",
            "source": recommendation["provider"],
        },
        {
            "label": "Reliability",
            "value": f"{recommendation['reliability']}%",
            "source": recommendation["provider"],
        },
    ]
    if recommendation["fare"] is not None:
        evidence.append({
            "label": "Fare",
            "value": f"{recommendation['currency'] or ''} {recommendation['fare']}".strip(),
            "source": recommendation["provider"],
        })
    else:
        evidence.append({
            "label": "Fare confidence",
            "value": "Unavailable",
            "source": recommendation["fare_type"],
        })
    if recommendation.get("boardwise"):
        boardwise = recommendation["boardwise"]
        evidence.extend([
            {"label": "Boarding confidence", "value": f"{boardwise['bcs']}/100", "source": "BoardWise reports"},
            {"label": "Crowding", "value": f"{boardwise['crowding']}%", "source": "BoardWise reports"},
        ])
    return {
        "origin": origin,
        "destination": destination,
        "options": options,
        "recommendation_id": recommendation["id"],
        "recommendation": {
            "option_id": recommendation["id"],
            "reason": recommendation_reason,
            "evidence": evidence,
            "uncertainties": [
                "Transit availability and fares depend on the connected provider.",
                "Boarding confidence reflects commuter reports, not an official vehicle feed.",
            ],
        },
        "provider_notice": "Transit results require a billed Google Maps Routes key. Road routes and place results use real OpenStreetMap providers when Google is unavailable.",
    }
