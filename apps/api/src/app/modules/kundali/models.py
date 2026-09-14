"""Table models for kundali."""
from sqlmodel import Field, SQLModel


class GuestGenerationCount(SQLModel, table=True):
    __tablename__ = "guest_generation_count"

    # YYYY-MM-DD
    date: str = Field(primary_key=True, max_length=10)
    count: int = Field(default=0)
