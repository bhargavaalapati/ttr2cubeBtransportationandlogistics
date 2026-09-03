import database
from database import Base, engine, SessionLocal, User, UserRole, Route, Stop, Report
import auth

def seed_real_hyderabad_data():
    # Re-create tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Clear existing data to ensure clean seed
        db.query(Report).delete()
        db.query(Stop).delete()
        db.query(Route).delete()
        db.query(User).delete()
        db.commit()

        print("Seeding Users...")
        # 1. Seed Accounts
        admin_user = User(
            email="admin@boardwise.hyderabad",
            hashed_password=auth.get_password_hash("admin123"),
            role=UserRole.ADMIN
        )
        commuter_user = User(
            email="commuter@boardwise.hyderabad",
            hashed_password=auth.get_password_hash("commuter123"),
            role=UserRole.COMMUTER
        )
        db.add_all([admin_user, commuter_user])
        db.commit()

        print("Seeding Routes and Stops...")
        # 2. Seed Real TGSRTC Routes & Stops
        routes_data = [
            {
                "code": "218D",
                "name": "Patancheru ↔ Koti (via Ameerpet)",
                "start": "Patancheru Bus Station",
                "end": "Koti Bus Terminal",
                "stops": [
                    {"name": "Patancheru Bus Station", "lat": 17.5332, "lng": 78.2656, "seq": 1},
                    {"name": "RC Puram", "lat": 17.5100, "lng": 78.2900, "seq": 2},
                    {"name": "BHEL Township", "lat": 17.4845, "lng": 78.3182, "seq": 3},
                    {"name": "Chandanagar", "lat": 17.4912, "lng": 78.3394, "seq": 4},
                    {"name": "Miyapur X Roads", "lat": 17.4968, "lng": 78.3614, "seq": 5},
                    {"name": "Kukatpally Housing Board (KPHB)", "lat": 17.4851, "lng": 78.3881, "seq": 6},
                    {"name": "Kukatpally Y Junction", "lat": 17.4849, "lng": 78.4138, "seq": 7},
                    {"name": "Moosapet", "lat": 17.4682, "lng": 78.4231, "seq": 8},
                    {"name": "Eragadda", "lat": 17.4523, "lng": 78.4350, "seq": 9},
                    {"name": "SR Nagar", "lat": 17.4429, "lng": 78.4421, "seq": 10},
                    {"name": "Ameerpet Metro Hub", "lat": 17.4375, "lng": 78.4482, "seq": 11},
                    {"name": "Punjagutta", "lat": 17.4256, "lng": 78.4521, "seq": 12},
                    {"name": "Khairatabad", "lat": 17.4111, "lng": 78.4623, "seq": 13},
                    {"name": "Lakdikapul", "lat": 17.4042, "lng": 78.4678, "seq": 14},
                    {"name": "Abids", "lat": 17.3912, "lng": 78.4745, "seq": 15},
                    {"name": "Koti Bus Terminal", "lat": 17.3854, "lng": 78.4867, "seq": 16},
                ]
            },
            {
                "code": "10H",
                "name": "Secunderabad ↔ Kondapur / HITEC City",
                "start": "Secunderabad Station",
                "end": "Kondapur Bus Depot",
                "stops": [
                    {"name": "Secunderabad Station", "lat": 17.4339, "lng": 78.5011, "seq": 1},
                    {"name": "Paradise", "lat": 17.4423, "lng": 78.4868, "seq": 2},
                    {"name": "Begumpet Airport", "lat": 17.4452, "lng": 78.4672, "seq": 3},
                    {"name": "Ameerpet Metro Hub", "lat": 17.4375, "lng": 78.4482, "seq": 4},
                    {"name": "Jubilee Hills Check Post", "lat": 17.4308, "lng": 78.4082, "seq": 5},
                    {"name": "Madhapur Police Station", "lat": 17.4481, "lng": 78.3914, "seq": 6},
                    {"name": "Cyber Towers / HITEC City", "lat": 17.4504, "lng": 78.3811, "seq": 7},
                    {"name": "Kondapur Bus Depot", "lat": 17.4612, "lng": 78.3678, "seq": 8},
                ]
            },
            {
                "code": "225L",
                "name": "Patancheru ↔ Secunderabad",
                "start": "Patancheru",
                "end": "Secunderabad Station",
                "stops": [
                    {"name": "Patancheru Bus Station", "lat": 17.5332, "lng": 78.2656, "seq": 1},
                    {"name": "Miyapur X Roads", "lat": 17.4968, "lng": 78.3614, "seq": 2},
                    {"name": "Balanagar", "lat": 17.4691, "lng": 78.4412, "seq": 3},
                    {"name": "Secunderabad Station", "lat": 17.4339, "lng": 78.5011, "seq": 4},
                ]
            }
        ]

        for r in routes_data:
            route_obj = Route(
                code=r["code"],
                name=r["name"],
                start_point=r["start"],
                end_point=r["end"]
            )
            db.add(route_obj)
            db.commit()
            db.refresh(route_obj)

            for s in r["stops"]:
                stop_obj = Stop(
                    route_id=route_obj.id,
                    name=s["name"],
                    lat=s["lat"],
                    lng=s["lng"],
                    sequence=s["seq"],
                    reliability_score=95.0
                )
                db.add(stop_obj)
            db.commit()

        # 3. Seed Realistic Baseline Crowding Reports
        print("Seeding Initial Crowd Reports...")
        route_218d = db.query(Route).filter(Route.code == "218D").first()
        ameerpet_stop = db.query(Stop).filter(Stop.name.contains("Ameerpet")).first()

        initial_reports = [
            Report(
                route_id=route_218d.id,
                stop_id=ameerpet_stop.id,
                crowding_level=88,
                did_stop=True,
                punctuality_score=70.0,
                raw_text="218D is packed at Ameerpet. Standing space only.",
                user_id=commuter_user.id
            ),
            Report(
                route_id=route_218d.id,
                stop_id=ameerpet_stop.id,
                crowding_level=95,
                did_stop=False,
                punctuality_score=60.0,
                raw_text="Bus did not stop at Ameerpet! Skipped completely.",
                user_id=commuter_user.id
            )
        ]
        db.add_all(initial_reports)
        db.commit()

        print("Database successfully seeded with real Hyderabad route data!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_real_hyderabad_data()