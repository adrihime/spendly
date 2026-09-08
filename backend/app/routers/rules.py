from enum import Enum
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models import Expense, Income, RecurringRule, RuleSkip, RuleUpdate
from app.recurrence import current_index, ensure_materialized_lazy
from app.routers.auth import require_user

router = APIRouter(prefix="/rules", tags=["rules"], dependencies=[Depends(require_user)])

_PROPAGATED = ("description", "amount", "category", "third_party")


class Scope(str, Enum):
    future = "future"
    all = "all"


def _model_for(kind: str):
    return Expense if kind == "expense" else Income


@router.get("/", response_model=List[RecurringRule])
def list_rules(session: Session = Depends(get_session)):
    ensure_materialized_lazy(session)
    return session.exec(select(RecurringRule).order_by(RecurringRule.created_at)).all()


@router.get("/{rule_id}", response_model=RecurringRule)
def get_rule(rule_id: UUID, session: Session = Depends(get_session)):
    rule = session.get(RecurringRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule


@router.patch("/{rule_id}", response_model=RecurringRule)
def update_rule(
    rule_id: UUID,
    patch: RuleUpdate,
    scope: Scope = Scope.future,
    session: Session = Depends(get_session),
):
    rule = session.get(RecurringRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    changes = patch.model_dump(exclude_unset=True)
    for key, value in changes.items():
        setattr(rule, key, value)
    session.add(rule)

    model = _model_for(rule.kind)
    statement = select(model).where(model.series_id == rule.id, model.detached == False)  # noqa: E712
    if scope == Scope.future:
        statement = statement.where(model.series_index >= current_index(rule))
        if rule.kind == "expense":
            statement = statement.where(model.paid == False)  # noqa: E712

    propagated = {k: v for k, v in changes.items() if k in _PROPAGATED and hasattr(model, k)}
    if propagated:
        for row in session.exec(statement).all():
            for key, value in propagated.items():
                setattr(row, key, value)
            session.add(row)

    session.commit()
    session.refresh(rule)
    return rule


@router.delete("/{rule_id}", status_code=204)
def delete_rule(rule_id: UUID, session: Session = Depends(get_session)):
    rule = session.get(RecurringRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    model = _model_for(rule.kind)
    for row in session.exec(select(model).where(model.series_id == rule.id)).all():
        session.delete(row)
    for skip in session.exec(select(RuleSkip).where(RuleSkip.rule_id == rule.id)).all():
        session.delete(skip)
    session.delete(rule)
    session.commit()
