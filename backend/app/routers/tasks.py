from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth import require_permission
from app.models.task import CompleteTaskRequest, TaskListResponse, TaskPublic
from app.services import task_service

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("", response_model=TaskListResponse)
def list_tasks(
    status: str | None = Query(default=None),
    assigned_to_me: bool = Query(default=False),
    limit: int = Query(default=50),
    user: dict = Depends(require_permission("tasks:read")),
):
    return task_service.list_tasks(user, status=status, assigned_to_me=assigned_to_me, limit=limit)


@router.post("/{task_id}/accept", response_model=TaskPublic)
def accept_task(task_id: str, user: dict = Depends(require_permission("tasks:accept"))):
    result = task_service.accept_task(task_id, user)
    if not result:
        raise HTTPException(status_code=404, detail="Task not found")
    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])
    return result


@router.post("/{task_id}/complete", response_model=TaskPublic)
def complete_task(task_id: str, body: CompleteTaskRequest, user: dict = Depends(require_permission("tasks:complete"))):
    result = task_service.complete_task(task_id, body.completed_note, user)
    if not result:
        raise HTTPException(status_code=404, detail="Task not found")
    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])
    return result
