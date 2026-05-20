# SimPrecios - Project Context

## Descripción
Sistema de monitoreo y denuncia de sobreprecios en mercados.

## Stack
### Backend
- FastAPI
- Python
- Supabase
- PostgreSQL

### Frontend
- React
- Next.js
- TailwindCSS

## Arquitectura
- backend/app/routes -> endpoints
- backend/app/services -> lógica de negocio
- backend/app/models -> modelos y schemas

## Convenciones
- snake_case
- UUID como PK
- Async/await
- Servicios separados por dominio
- Validaciones con Pydantic

## Objetivos de código
- Código modular
- Buen tipado
- Evitar lógica duplicada
- Mantener separación controller/service/database