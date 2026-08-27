import sys
import os

# Add root directory to python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal, engine, Base
from backend.models import User, Restaurant, FoodItem
from backend.security import hash_password


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Admin Account
        admin = db.query(User).filter(User.email == "admin@mealsprint.com").first()
        if not admin:
            admin = User(
                full_name="Admin User",
                email="admin@mealsprint.com",
                password_hash=hash_password("Admin@12345"),
                role="admin"
            )
            db.add(admin)
            print("✓ Seeded Admin User: admin@mealsprint.com (Password: Admin@12345)")

        # 2. Seed Regular Customer Account
        customer = db.query(User).filter(User.email == "user@mealsprint.com").first()
        if not customer:
            customer = User(
                full_name="Aman Raj",
                email="user@mealsprint.com",
                password_hash=hash_password("User@12345"),
                role="customer"
            )
            db.add(customer)
            print("✓ Seeded Regular User: user@mealsprint.com (Password: User@12345)")

        db.commit()

        # 3. Seed Restaurants and Food Items matching the screenshots
        if db.query(Restaurant).count() == 0:
            restaurants_data = [
                {
                    "name": "alok restaurant",
                    "cuisine_type": "indian",
                    "address": "123 mg road",
                    "city": "mumbai",
                    "latitude": 19.0760,
                    "longitude": 72.8777,
                    "rating": 5.0,
                    "is_open": True,
                    "icon_name": "curry",
                    "items": [
                        {
                            "name": "butter panner",
                            "description": "rich creamy tomato gravy with paneer",
                            "price": 199.0,
                            "is_available": True
                        },
                        {
                            "name": "dal makhani",
                            "description": "slow cooked black lentils with cream",
                            "price": 179.0,
                            "is_available": True
                        }
                    ]
                },
                {
                    "name": "Test Biryani",
                    "cuisine_type": "Indian",
                    "address": "1 Test St",
                    "city": "Mumbai",
                    "latitude": 19.0820,
                    "longitude": 72.8810,
                    "rating": 4.2,
                    "is_open": True,
                    "icon_name": "curry",
                    "items": [
                        {
                            "name": "Chicken Biryani",
                            "description": "Rich dum cooked aromatic basmati rice",
                            "price": 299.0,
                            "is_available": True
                        }
                    ]
                },
                {
                    "name": "vipin restaurants",
                    "cuisine_type": "indian",
                    "address": "lucknow highway",
                    "city": "lucknow",
                    "latitude": 26.8467,
                    "longitude": 80.9462,
                    "rating": 4.0,
                    "is_open": True,
                    "icon_name": "curry",
                    "items": [
                        {
                            "name": "chat panner",
                            "description": "tangy spicy cottage cheese tossed in herbs",
                            "price": 149.0,
                            "is_available": True
                        }
                    ]
                },
                {
                    "name": "rahul",
                    "cuisine_type": "india",
                    "address": "qweenka okhala",
                    "city": "delhi",
                    "latitude": 28.5355,
                    "longitude": 77.2687,
                    "rating": 5.0,
                    "is_open": True,
                    "icon_name": "plate",
                    "items": [
                        {
                            "name": "butter chiken",
                            "description": "rich roasted chicken cooked in creamy tomato butter gravy",
                            "price": 299.0,
                            "is_available": True
                        }
                    ]
                },
                {
                    "name": "The pixa lover",
                    "cuisine_type": "indian",
                    "address": "Saketetnagar",
                    "city": "Bhopal",
                    "latitude": 23.2599,
                    "longitude": 77.4126,
                    "rating": 5.0,
                    "is_open": True,
                    "icon_name": "curry",
                    "items": [
                        {
                            "name": "Tomato Pixa",
                            "description": "thin crust loaded with herb tomatoes and cheese",
                            "price": 249.0,
                            "is_available": True
                        }
                    ]
                }
            ]

            for r_data in restaurants_data:
                items = r_data.pop("items")
                resto = Restaurant(**r_data)
                db.add(resto)
                db.flush()

                for item_data in items:
                    food_item = FoodItem(restaurant_id=resto.id, **item_data)
                    db.add(food_item)

            db.commit()
            print("✓ Seeded Restaurants and Menu Items successfully.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()