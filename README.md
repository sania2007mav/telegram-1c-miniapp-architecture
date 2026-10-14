# Telegram Mini App + 1С OData

Архитектура: вход по номеру в боте, весь UI в Mini App, доступ к 1С через OData (прокси на бэкенде), шаринг баз по ACL (телефоны).

Файл canvas: [`telegram-1c-miniapp-architecture.canvas.tsx`](./telegram-1c-miniapp-architecture.canvas.tsx)

## Поток

```
Пользователь → Бот (только телефон) → Backend → Mini App (весь UI)
                                              ↓
                                         Backend → 1С OData
                                              ↑
                         единый логин базы (только владелец задаёт)
```

В 1С OData ходит **только сервер**. Mini App не вызывает OData напрямую.

## Зафиксированные решения

| Вопрос | Решение |
|---|---|
| Номер сверяется с чем | Свой бэкенд |
| OData логин/пароль | На бэкенде; **один на базу**; задаёт только создатель |
| Бот vs Mini App | Бот = только телефон; весь UI — Mini App |
| Кто заводит базы | Self-service в Mini App |
| Шаринг | **Только ACL**: владелец добавляет телефоны к базе |
| Доступ гостя | Видит базу в списке; **не** меняет вход и ACL |
| Пароль 1С сменили | Re-auth в Mini App — **только владелец** |

## ACL (доступ по телефону)

1. Пользователь **А** создаёт базу (URL + логин/пароль OData) → становится **owner**.
2. А в Mini App добавляет телефоны в список доступа базы.
3. Пользователь **Б** (этот номер) открывает Mini App → видит базу А в списке.
4. Запросы Б в 1С идут **учёткой А** (единый логин базы).
5. Менять credentials / ACL может только **owner**.

Список баз для user = **где я owner** ∪ **куда добавлен мой телефон**.

## Сценарий пользователя

1. **Бот** — номер → Backend создаёт/находит user  
2. **Бот** — кнопка «Открыть приложение»  
3. **Mini App (owner)** — добавить базу + OData → проверка → сохранить  
4. **Mini App (owner)** — ACL: добавить/убрать телефоны  
5. **Mini App (все с доступом)** — работа (фонды) через Backend → OData  
6. **Mini App (owner)** — при 401 → повторный ввод OData  

## Компоненты

| Компонент | Роль |
|---|---|
| Telegram Bot | Только телефон + WebApp-кнопка |
| Backend API | Users, bases, credentials (owner), ACL, OData-прокси, initData |
| Mini App | Базы, ACL (owner), re-auth (owner), фонды |
| 1С OData | Проверка учётки; права на данные в 1С |

## Модель данных

| Сущность | Ключ | Смысл |
|---|---|---|
| User | phone, telegram_id | При share contact |
| Base | id, owner_user_id | name, odata_url |
| ODataCredential | base_id | login + password (encrypted); 1:1 с базой; пишет только owner |
| BaseAccess | base_id + phone | ACL: кому видна база |
| Session | user | initData → токен |

## Хостинг (целевой)

- Домен: `*.melnichuk.kz` (поддомен, напр. `pocket.melnichuk.kz`)
- CT 200 (Proxmox) + Cloudflare tunnel + nginx
- 1С: VM на площадке / URL, который задаёт owner

## MVP

- Бот: телефон  
- Mini App: создать базу, ACL по телефонам, список «мои + расшаренные»  
- OData: единый логин, re-auth только owner  
- Фонды  
