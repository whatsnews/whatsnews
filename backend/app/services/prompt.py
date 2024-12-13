# app/services/prompt.py
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy import or_
from fastapi import HTTPException, status
from slugify import slugify

from app.models.prompt import Prompt, TemplateType, VisibilityType
from app.models.user import User
from app.schemas.prompt import PromptCreate, PromptUpdate
from app.services.llm import llm_service

class PromptService:
    def __init__(self, db: Session):
        self.db = db

    def _generate_unique_slug(self, name: str, user_id: int) -> str:
        """Generate a unique slug for a prompt."""
        base_slug = slugify(name)
        slug = base_slug
        counter = 1
        
        while self.db.query(Prompt).filter(
            Prompt.slug == slug,
            Prompt.user_id == user_id
        ).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        return slug

    def create_prompt(self, prompt_data: PromptCreate, user: User) -> Prompt:
        """Create a new prompt with a unique slug."""
        try:
            # Validate custom template if provided
            if prompt_data.template_type == TemplateType.NARRATIVE and prompt_data.custom_template:
                if not llm_service.validate_template_format(prompt_data.custom_template):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid custom template format"
                    )

            # Generate unique slug
            slug = self._generate_unique_slug(prompt_data.name, user.id)

            prompt = Prompt(
                name=prompt_data.name,
                slug=slug,
                content=prompt_data.content,
                template_type=prompt_data.template_type,
                custom_template=prompt_data.custom_template,
                visibility=prompt_data.visibility,
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

    def get_prompt_by_username_and_slug(
        self, 
        username: str, 
        slug: str,
        current_user: Optional[User] = None
    ) -> Prompt:
        """Get prompt by username and slug with visibility checks."""
        try:
            prompt = (
                self.db.query(Prompt)
                .join(User)
                .filter(User.username == username, Prompt.slug == slug)
                .first()
            )

            if not prompt:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Prompt not found"
                )

            # Check visibility permissions
            if prompt.visibility == VisibilityType.PRIVATE:
                if not current_user or prompt.user_id != current_user.id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Not authorized to access this prompt"
                    )
            elif prompt.visibility == VisibilityType.INTERNAL:
                if not current_user:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Authentication required for internal prompts"
                    )

            return prompt
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch prompt"
            ) from e

    def get_prompts(
        self,
        user: User,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        include_internal: bool = True,
        include_public: bool = True
    ) -> List[Prompt]:
        """Get list of prompts with optional filtering."""
        try:
            # Start with base query for user's own prompts
            query = self.db.query(Prompt)
            
            # Build visibility conditions
            visibility_conditions = [
                Prompt.user_id == user.id,  # User's own prompts
            ]
            
            if include_internal:
                visibility_conditions.append(
                    (Prompt.visibility == VisibilityType.INTERNAL) & 
                    (Prompt.user_id != user.id)
                )
            
            if include_public:
                visibility_conditions.append(
                    (Prompt.visibility == VisibilityType.PUBLIC) & 
                    (Prompt.user_id != user.id)
                )
            
            # Apply visibility conditions
            query = query.filter(or_(*visibility_conditions))

            if search:
                search_term = f"%{search}%"
                query = query.filter(
                    or_(
                        Prompt.name.ilike(search_term),
                        Prompt.content.ilike(search_term),
                        Prompt.slug.ilike(search_term)
                    )
                )

            prompts = query.order_by(Prompt.created_at.desc()).offset(skip).limit(limit).all()
            return prompts
        except SQLAlchemyError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch prompts"
            ) from e

    def get_public_prompts(
        self,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None
    ) -> List[Prompt]:
        """Get list of public prompts."""
        try:
            query = self.db.query(Prompt).filter(Prompt.visibility == VisibilityType.PUBLIC)

            if search:
                search_term = f"%{search}%"
                query = query.filter(
                    or_(
                        Prompt.name.ilike(search_term),
                        Prompt.content.ilike(search_term),
                        Prompt.slug.ilike(search_term)
                    )
                )

            prompts = query.order_by(Prompt.created_at.desc()).offset(skip).limit(limit).all()
            return prompts
        except SQLAlchemyError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch public prompts"
            ) from e

    def get_internal_prompts(
        self,
        user: User,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None
    ) -> List[Prompt]:
        """Get list of internal prompts."""
        try:
            query = self.db.query(Prompt).filter(
                Prompt.visibility == VisibilityType.INTERNAL,
                Prompt.user_id != user.id
            )

            if search:
                search_term = f"%{search}%"
                query = query.filter(
                    or_(
                        Prompt.name.ilike(search_term),
                        Prompt.content.ilike(search_term),
                        Prompt.slug.ilike(search_term)
                    )
                )

            prompts = query.order_by(Prompt.created_at.desc()).offset(skip).limit(limit).all()
            return prompts
        except SQLAlchemyError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch internal prompts"
            ) from e

    def get_prompt_by_id(self, prompt_id: int, user: Optional[User] = None) -> Prompt:
        """Get a specific prompt by ID."""
        prompt = self.db.query(Prompt).filter(Prompt.id == prompt_id).first()

        if not prompt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prompt not found"
            )

        # Check visibility permissions
        if prompt.visibility == VisibilityType.PRIVATE:
            if not user or prompt.user_id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to access this prompt"
                )
        elif prompt.visibility == VisibilityType.INTERNAL:
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Authentication required for internal prompts"
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

        # Only owner can update prompt
        if prompt.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this prompt"
            )

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
            
            # Update slug if name is being changed
            if 'name' in update_data:
                update_data['slug'] = self._generate_unique_slug(
                    update_data['name'],
                    user.id
                )

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

        # Only owner can delete prompt
        if prompt.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this prompt"
            )

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

    def get_prompt_with_news_count(
        self,
        prompt_id: int,
        user: Optional[User] = None
    ) -> dict:
        """Get prompt with associated news count."""
        prompt = self.get_prompt_by_id(prompt_id, user)
        news_count = len(prompt.news_items)
        
        return {
            "prompt": prompt,
            "news_count": news_count
        }