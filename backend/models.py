from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="customer", nullable=False)  # 'customer' or 'admin'
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")


class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(120), nullable=False, index=True)
    cuisine_type = Column(String(80), nullable=False)
    address = Column(String(255), nullable=False)
    city = Column(String(80), nullable=False, index=True)
    latitude = Column(Float, default=19.0760)
    longitude = Column(Float, default=72.8777)
    rating = Column(Float, default=5.0)
    is_open = Column(Boolean, default=True)
    icon_name = Column(String(50), default="plate")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    food_items = relationship("FoodItem", back_populates="restaurant", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="restaurant")


class FoodItem(Base):
    __tablename__ = "food_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(120), nullable=False)
    description = Column(String(255), nullable=True)
    price = Column(Float, nullable=False)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    restaurant = relationship("Restaurant", back_populates="food_items")
    order_items = relationship("OrderItem", back_populates="food_item")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_code = Column(String(20), unique=True, index=True, nullable=False)  # e.g., #22E4793B
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id", ondelete="RESTRICT"), nullable=False)
    status = Column(String(30), default="PENDING")  # PENDING, CONFIRMED, DELIVERED, CANCELLED
    total_amount = Column(Float, nullable=False)
    delivery_address = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="orders")
    restaurant = relationship("Restaurant", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    food_item_id = Column(Integer, ForeignKey("food_items.id", ondelete="SET NULL"), nullable=True)
    item_name = Column(String(120), nullable=False)
    unit_price = Column(Float, nullable=False)
    quantity = Column(Integer, default=1)
    total_price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    food_item = relationship("FoodItem", back_populates="order_items")