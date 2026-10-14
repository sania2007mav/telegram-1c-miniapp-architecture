# Telegram Mini App + 1С OData

Архитектура: вход по номеру телефона в боте, весь UI в Mini App, доступ к 1С через OData (прокси на бэкенде).

Файл canvas для Cursor: [`telegram-1c-miniapp-architecture.canvas.tsx`](./telegram-1c-miniapp-architecture.canvas.tsx)  
(открывается в Cursor как Canvas; на GitHub — исходник React/TSX.)

## Поток

```
Пользователь → Бот (только телефон) → Backend → Mini App (весь UI)
                                              ↓
                                         Backend → 1С OData
```

В 1С OData ходит **только сервер**. Mini App не вызывает OData напрямую.

## Зафиксированные решения

| Вопрос | Решение |
|---|---|
| Номер сверяется с чем | Свой бэкенд (реестр у нас) |
| OData логин/пароль | На бэкенде; один раз после успешной проверки к 1С |
| Бот vs Mini App | Бот = только телефон; весь UI — Mini App |
| Кто заводит user / базы | Сам пользователь в Mini App (self-service) |
| OData-учётка | На каждую базу отдельно (`user × base`) |
| Пароль 1С сменили | Форма повторного входа в Mini App + обновление секрета |

## Сценарий пользователя

1. **Бот** — отправить номер → Backend создаёт/находит user по телефону  
2. **Бот** — кнопка «Открыть приложение»  
3. **Mini App** — добавить базу: URL OData + логин/пароль → проверка → сохранить  
4. **Mini App** — список своих баз → работа (фонды и т.д.) через Backend → OData  
5. **Mini App** — 401/ошибка auth от 1С → форма повторного входа → обновить credentials  

## Компоненты

| Компонент | Роль |
|---|---|
| Telegram Bot | Только запрос телефона + WebApp-кнопка |
| Backend API | Реестр user, базы, encrypted credentials, прокси OData, initData |
| Mini App | CRUD баз, OData-логин / re-auth, фонды и сценарии |
| 1С OData | Проверка учётки; права на данные на стороне 1С |

## Модель данных (контур)

| Сущность | Ключ | Смысл |
|---|---|---|
| User | phone, telegram_id | При первом share contact |
| BaseConnection | user_id + base_id | name, odata_url |
| ODataCredential | user_id + base_id | login + password (encrypted), 1:1 с базой |
| Session | user | Telegram initData → наш токен |

## MVP

- Бот: телефон  
- Mini App: добавить базу  
- OData: один раз / re-auth  
- Фонды  

Админки для реестра нет: пользователь сам добавляет базы и учётки в Mini App.
