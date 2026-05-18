from pydantic import BaseModel, Field


class AssignTaskRequest(BaseModel):
    assigned_to_username: str | None = None
    assigned_to_device_id: str | None = None
    note: str = ""


class CompleteTaskRequest(BaseModel):
    completed_note: str = ""


class TaskListQuery(BaseModel):
    status: str | None = None
    assigned_to_me: bool = False


class TaskPublic(BaseModel):
    task_id: str
    event_id: str
    status: str
    note: str
    assigned_to_username: str | None = None
    assigned_to_display_name: str | None = None
    assigned_to_device_id: str | None = None
    assigned_by_username: str
    assigned_by_display_name: str
    created_at: str
    accepted_at: str | None = None
    completed_at: str | None = None
    completed_note: str = ""
    vehicle_class: str
    confidence: float
    start_time: str
    device_id: str
    review_priority: str
    thumbnail_url: str = ""


class TaskListResponse(BaseModel):
    items: list[TaskPublic] = Field(default_factory=list)
    total: int
