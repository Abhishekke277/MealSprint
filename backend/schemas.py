from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


# User Schemas
class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = "customer"  # 'customer' or 'admin'


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    role: str

    class Config:
        from_attributes = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# Restaurant Schemas
class RestaurantCreate(BaseModel):
    name: str
    cuisine_type: str
    address: str
    city: str
    latitude: Optional[float] = 19.0760
    longitude: Optional[float] = 72.8777
    rating: Optional[float] = 5.0
    is_open: Optional[bool] = True


class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    cuisine_type: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    rating: Optional[float] = None
    is_open: Optional[bool] = None


class FoodItemOut(BaseModel):
    id: int
    restaurant_id: int
    name: str
    description: Optional[str] = None
    price: float
    is_available: bool

    class Config:
        from_attributes = True


class RestaurantOut(BaseModel):
    id: int
    name: str
    cuisine_type: str
    address: str
    city: str
    latitude: float
    longitude: float
    rating: float
    is_open: bool
    food_items: List[FoodItemOut] = []

    class Config:
        from_attributes = True


# Food Item Schemas
class FoodItemCreate(BaseModel):
    restaurant_id: int
    name: str
    description: Optional[str] = None
    price: float
    is_available: Optional[bool] = True


class FoodItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    is_available: Optional[bool] = None


# Order Schemas
class OrderItemIn(BaseModel):
    food_item_id: int
    quantity: int


class OrderCreate(BaseModel):
    restaurant_id: int
    delivery_address: str
    items: List[OrderItemIn]


class OrderItemOut(BaseModel):
    id: int
    item_name: str
    unit_price: float
    quantity: int
    total_price: float

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: int
    order_code: str
    restaurant_id: int
    restaurant_name: Optional[str] = None
    status: str
    total_amount: float
    delivery_address: str
    items: List[OrderItemOut] = []
    created_at: datetime

    class Config:
        from_attributes = True