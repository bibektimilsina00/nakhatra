from pydantic import BaseModel, ConfigDict


class PractitionerApplicationStats(BaseModel):
    model_config = ConfigDict(frozen=True)
    pending: int
    approved: int
    rejected: int

class AdminStatsOverview(BaseModel):
    model_config = ConfigDict(frozen=True)
    
    total_users: int
    users_last_7_days: int
    users_last_30_days: int
    
    total_saved_kundalis: int
    total_chat_sessions: int
    total_chat_messages: int
    
    practitioner_applications: PractitionerApplicationStats
    total_consultations: int
