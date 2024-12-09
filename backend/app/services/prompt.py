# app/services/prompt.py
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status

from app.models.prompt import Prompt, TemplateType
from app.models.user import User
from app.schemas.prompt import PromptCreate, PromptUpdate
from app.services.llm import llm_service

class PromptService:
    def __init__(self, db: Session):
        self.db = db

    def create_prompt(self, prompt_data: PromptCreate, user: User) -> Prompt:
        """Create a new prompt."""
        try:
            # Validate custom template if provided
            if prompt_data.template_type == TemplateType.NARRATIVE and prompt_data.custom_template:
                if not llm_service.validate_template_format(prompt_data.custom_template):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid custom template format"
                    )

            prompt = Prompt(
                name=prompt_data.name,
                content=prompt_data.content,
                template_type=prompt_data.template_type,
                custom_template=prompt_data.custom_template,
                user_id=user.id
            )
            self.db.add(prompt)
            self.db.commit()
            self.db.refresh(prompt)
            return prompt
        except SQLAlchemyError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create prompt"
            ) from e

    def get_prompts(
        self,
        user: User,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None
    ) -> List[Prompt]:
        """Get list of prompts with optional filtering."""
        try:
            query = self.db.query(Prompt).filter(Prompt.user_id == user.id)

            if search:
                search_term = f"%{search}%"
                query = query.filter(
                    (Prompt.name.ilike(search_term)) |
                    (Prompt.content.ilike(search_term))
                )

            prompts = query.order_by(Prompt.created_at.desc()).offset(skip).limit(limit).all()
            return prompts
        except SQLAlchemyError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch prompts"
            ) from e

    def get_prompt_by_id(self, prompt_id: int, user: User) -> Prompt:
        """Get a specific prompt by ID."""
        prompt = self.db.query(Prompt).filter(
            Prompt.id == prompt_id,
            Prompt.user_id == user.id
        ).first()

        if not prompt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prompt not found"
            )

        return prompt

    def update_prompt(
        self,
        prompt_id: int,
        prompt_data: PromptUpdate,
        user: User
    ) -> Prompt:
        """Update an existing prompt."""
        prompt = self.get_prompt_by_id(prompt_id, user)

        try:
            # Validate custom template if being updated
            if (
                prompt_data.template_type == TemplateType.NARRATIVE and
                prompt_data.custom_template is not None
            ):
                if not llm_service.validate_template_format(prompt_data.custom_template):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid custom template format"
                    )

            update_data = prompt_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(prompt, field, value)

            self.db.commit()
            self.db.refresh(prompt)
            return prompt
        except SQLAlchemyError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update prompt"
            ) from e

    def delete_prompt(self, prompt_id: int, user: User) -> None:
        """Delete a prompt."""
        prompt = self.get_prompt_by_id(prompt_id, user)

        try:
            self.db.delete(prompt)
            self.db.commit()
        except SQLAlchemyError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to delete prompt"
            ) from e

    def get_template_types(self) -> List[str]:
        """Get list of available template types."""
        return [template.value for template in TemplateType]

    def validate_prompt_template(
        self,
        template_type: TemplateType,
        custom_template: Optional[str] = None
    ) -> bool:
        """Validate a prompt template."""
        if template_type == TemplateType.NARRATIVE and custom_template:
            return llm_service.validate_template_format(custom_template)
        return True

    def count_user_prompts(self, user: User) -> int:
        """Count total prompts for a user."""
        return self.db.query(Prompt).filter(Prompt.user_id == user.id).count()

    def get_prompt_with_news_count(self, prompt_id: int, user: User) -> dict:
        """Get prompt with associated news count."""
        prompt = self.get_prompt_by_id(prompt_id, user)
        news_count = len(prompt.news_items)
        
        return {
            "prompt": prompt,
            "news_count": news_count
        }