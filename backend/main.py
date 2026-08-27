import uuid
import math
from typing import List, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload

from backend.database import Base, engine, get_db
from backend.models import User, Restaurant, FoodItem, Order, OrderItem
from backend.schemas import (
    UserRegister, UserLogin, UserOut, TokenOut,
    RestaurantCreate, RestaurantUpdate, RestaurantOut,
    FoodItemCreate, FoodItemUpdate, FoodItemOut,
    OrderCreate, OrderOut
)
from backend.security import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_admin
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(title="QuickBite / MealSprint API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "https://mealsprint1.netlify.app",        # Aapka Netlify frontend URL
    "http://localhost:3000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://127.0.0.1:3000",
    "null"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    )


# ==========================================
# 1. AUTHENTICATION CRUD
# ==========================================
@app.post("/auth/register", response_model=TokenOut, status_code=201)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.email, "role": user.role, "uid": user.id})
    return {"access_token": token, "token_type": "bearer", "user": user}


@app.post("/auth/login", response_model=TokenOut)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user.email, "role": user.role, "uid": user.id})
    return {"access_token": token, "token_type": "bearer", "user": user}


@app.get("/auth/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return user


# ==========================================
# 2. RESTAURANTS CRUD
# ==========================================
@app.get("/restaurants", response_model=List[RestaurantOut])
def get_restaurants(
    search: Optional[str] = None,
    city: Optional[str] = None,
    cuisine: Optional[str] = None,
    open_only: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(Restaurant).options(joinedload(Restaurant.food_items))
    if search:
        query = query.filter((Restaurant.name.ilike(f"%{search}%")) | (Restaurant.cuisine_type.ilike(f"%{search}%")))
    if city:
        query = query.filter(Restaurant.city.ilike(f"%{city}%"))
    if cuisine:
        query = query.filter(Restaurant.cuisine_type.ilike(f"%{cuisine}%"))
    if open_only:
        query = query.filter(Restaurant.is_open == True)
    return query.all()


@app.get("/restaurants/{restaurant_id}", response_model=RestaurantOut)
def get_restaurant_by_id(restaurant_id: int, db: Session = Depends(get_db)):
    r = db.query(Restaurant).options(joinedload(Restaurant.food_items)).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return r


@app.post("/admin/restaurants", response_model=RestaurantOut, status_code=201)
def create_restaurant(payload: RestaurantCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    r = Restaurant(**payload.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


@app.put("/admin/restaurants/{restaurant_id}", response_model=RestaurantOut)
def update_restaurant(restaurant_id: int, payload: RestaurantUpdate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    for key, val in payload.model_dump(exclude_unset=True).items():
        setattr(r, key, val)
    db.commit()
    db.refresh(r)
    return r


@app.delete("/admin/restaurants/{restaurant_id}")
def delete_restaurant(restaurant_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    db.delete(r)
    db.commit()
    return {"message": "Restaurant deleted"}


# ==========================================
# 3. FOOD ITEMS (MENU) CRUD
# ==========================================
@app.get("/foods", response_model=List[FoodItemOut])
def get_foods(restaurant_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(FoodItem)
    if restaurant_id:
        query = query.filter(FoodItem.restaurant_id == restaurant_id)
    return query.all()


@app.post("/admin/foods", response_model=FoodItemOut, status_code=201)
def create_food(payload: FoodItemCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    food = FoodItem(**payload.model_dump())
    db.add(food)
    db.commit()
    db.refresh(food)
    return food


@app.put("/admin/foods/{food_id}", response_model=FoodItemOut)
def update_food(food_id: int, payload: FoodItemUpdate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    food = db.query(FoodItem).filter(FoodItem.id == food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")
    for key, val in payload.model_dump(exclude_unset=True).items():
        setattr(food, key, val)
    db.commit()
    db.refresh(food)
    return food


@app.delete("/admin/foods/{food_id}")
def delete_food(food_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    food = db.query(FoodItem).filter(FoodItem.id == food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")
    db.delete(food)
    db.commit()
    return {"message": "Food item deleted"}


# ==========================================
# 4. ORDERS & PAYMENT CRUD
# ==========================================
@app.post("/orders", response_model=OrderOut, status_code=201)
def create_order(payload: OrderCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    total = 0.0
    order_items_objs = []
    for item_in in payload.items:
        food = db.query(FoodItem).filter(FoodItem.id == item_in.food_item_id).first()
        if not food:
            raise HTTPException(status_code=404, detail=f"Item {item_in.food_item_id} not found")
        item_total = food.price * item_in.quantity
        total += item_total
        order_items_objs.append(
            OrderItem(food_item_id=food.id, item_name=food.name, unit_price=food.price, quantity=item_in.quantity, total_price=item_total)
        )

    order_code = f"#{uuid.uuid4().hex[:8].upper()}"
    new_order = Order(
        order_code=order_code,
        user_id=user.id,
        restaurant_id=payload.restaurant_id,
        status="PENDING",
        total_amount=round(total, 2),
        delivery_address=payload.delivery_address,
        items=order_items_objs
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    return {
        "id": new_order.id,
        "order_code": new_order.order_code,
        "restaurant_id": new_order.restaurant_id,
        "restaurant_name": new_order.restaurant.name if new_order.restaurant else "",
        "status": new_order.status,
        "total_amount": new_order.total_amount,
        "delivery_address": new_order.delivery_address,
        "items": new_order.items,
        "created_at": new_order.created_at
    }


@app.get("/orders", response_model=List[OrderOut])
def get_my_orders(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    orders = db.query(Order).options(joinedload(Order.items), joinedload(Order.restaurant)).filter(Order.user_id == user.id).order_by(Order.created_at.desc()).all()
    res = []
    for o in orders:
        res.append({
            "id": o.id,
            "order_code": o.order_code,
            "restaurant_id": o.restaurant_id,
            "restaurant_name": o.restaurant.name if o.restaurant else "",
            "status": o.status,
            "total_amount": o.total_amount,
            "delivery_address": o.delivery_address,
            "items": o.items,
            "created_at": o.created_at
        })
    return res


@app.put("/orders/{order_id}/pay")
def pay_order(order_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = "CONFIRMED"
    db.commit()
    return {"message": "Payment successful", "status": "CONFIRMED"}


@app.delete("/orders/{order_id}")
def cancel_order(order_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = "CANCELLED"
    db.commit()
    return {"message": "Order cancelled", "status": "CANCELLED"}