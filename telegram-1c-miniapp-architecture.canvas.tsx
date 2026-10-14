import {
  Callout,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  Pill,
  Row,
  Stack,
  Stat,
  Table,
  Text,
  computeDAGLayout,
  mergeStyle,
  useHostTheme,
} from "cursor/canvas";

const FLOW_NODES = [
  { id: "user", label: "Пользователь", sub: "Telegram" },
  { id: "bot", label: "Бот", sub: "только телефон" },
  { id: "api", label: "Backend", sub: "реестр + secrets" },
  { id: "mini", label: "Mini App", sub: "базы · OData · UI" },
  { id: "odata", label: "1С OData", sub: "через Backend" },
];

const FLOW_EDGES = [
  { from: "user", to: "bot" },
  { from: "bot", to: "api" },
  { from: "api", to: "mini" },
  { from: "mini", to: "api" },
  { from: "api", to: "odata" },
];

const NODE_LABELS: Record<string, { label: string; sub: string }> = Object.fromEntries(
  FLOW_NODES.map((n) => [n.id, { label: n.label, sub: n.sub }])
);

function FlowDiagram() {
  const theme = useHostTheme();
  const layout = computeDAGLayout({
    nodes: FLOW_NODES.map(({ id }) => ({ id })),
    edges: FLOW_EDGES,
    direction: "horizontal",
    nodeWidth: 132,
    nodeHeight: 52,
    rankGap: 56,
    nodeGap: 28,
    padding: 12,
  });

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      style={{ display: "block", maxWidth: 900 }}
    >
      {layout.edges.map((e, i) => (
        <line
          key={i}
          x1={e.sourceX}
          y1={e.sourceY}
          x2={e.targetX}
          y2={e.targetY}
          stroke={e.isBackEdge ? theme.stroke.secondary : theme.accent.primary}
          strokeWidth={1.5}
          strokeDasharray={e.isBackEdge ? "4 3" : undefined}
          markerEnd="url(#arrow)"
        />
      ))}
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={theme.accent.primary} />
        </marker>
      </defs>
      {layout.nodes.map((n) => {
        const meta = NODE_LABELS[n.id];
        return (
          <g key={n.id}>
            <rect
              x={n.x}
              y={n.y}
              width={132}
              height={52}
              rx={4}
              fill={theme.fill.secondary}
              stroke={theme.stroke.primary}
              strokeWidth={1}
            />
            <text
              x={n.x + 66}
              y={n.y + 22}
              textAnchor="middle"
              fill={theme.text.primary}
              fontSize={12}
              fontWeight={600}
            >
              {meta.label}
            </text>
            <text
              x={n.x + 66}
              y={n.y + 38}
              textAnchor="middle"
              fill={theme.text.tertiary}
              fontSize={10}
            >
              {meta.sub}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Telegram1cMiniappArchitecture() {
  return (
    <Stack gap={24} style={{ padding: 24, maxWidth: 960 }}>
      <Stack gap={8}>
        <H1>Telegram Mini App + 1С OData</H1>
        <Text tone="secondary">
          Архитектура зафиксирована: self-service в Mini App, OData на каждую базу,
          повторный логин при смене пароля.
        </Text>
      </Stack>

      <Callout tone="success">
        Ключевые решения закрыты — можно идти в ТЗ / скелет репозитория.
      </Callout>

      <Grid columns={3} gap={12}>
        <Stat value="Self-service" label="user сам заводит базы" />
        <Stat value="Per-base" label="OData на каждую базу" />
        <Stat value="Re-auth" label="если пароль 1С сменили" />
      </Grid>

      <Stack gap={8}>
        <H2>Зафиксировано</H2>
        <Table
          headers={["Вопрос", "Решение"]}
          rows={[
            [
              "Номер сверяется с чем",
              "Свой бэкенд (реестр у нас)",
            ],
            [
              "OData логин/пароль",
              "На бэкенде; один раз после успешной проверки к 1С",
            ],
            [
              "Бот vs Mini App",
              "Бот = только телефон; весь UI — Mini App",
            ],
            [
              "Кто заводит user / базы",
              "Сам пользователь в Mini App (self-service)",
            ],
            [
              "OData-учётка",
              "На каждую базу отдельно (user × base)",
            ],
            [
              "Пароль 1С сменили",
              "Форма повторного входа в Mini App + обновление секрета",
            ],
          ]}
          rowTone={[
            "success",
            "success",
            "success",
            "success",
            "success",
            "success",
          ]}
        />
      </Stack>

      <Stack gap={8}>
        <H2>Поток</H2>
        <Card>
          <CardBody>
            <FlowDiagram />
            <Text size="small" tone="tertiary" style={{ marginTop: 8 }}>
              Пунктир: Mini App ↔ Backend. В 1С OData ходит только сервер.
            </Text>
          </CardBody>
        </Card>
      </Stack>

      <Stack gap={8}>
        <H2>Сценарий пользователя</H2>
        <Table
          headers={["Шаг", "Где", "Что происходит"]}
          rows={[
            ["1", "Бот", "Отправить номер → Backend создаёт/находит user по телефону"],
            ["2", "Бот", "Кнопка «Открыть приложение»"],
            [
              "3",
              "Mini App",
              "Добавить базу: URL OData + логин/пароль → проверка → сохранить",
            ],
            [
              "4",
              "Mini App",
              "Список своих баз → работа (фонды и т.д.) через Backend → OData",
            ],
            [
              "5",
              "Mini App",
              "401/ошибка auth от 1С → форма повторного входа → обновить credentials",
            ],
          ]}
        />
      </Stack>

      <H2>Компоненты</H2>
      <Grid columns={2} gap={12}>
        <Card>
          <CardHeader trailing={<Pill tone="info">тонкий</Pill>}>
            Telegram Bot
          </CardHeader>
          <CardBody>
            <Stack gap={6}>
              <Text size="small">Только запрос телефона</Text>
              <Text size="small">WebApp-кнопка в Mini App</Text>
              <Text size="small" tone="tertiary">
                Без меню и бизнес-сценариев в чате
              </Text>
            </Stack>
          </CardBody>
        </Card>
        <Card>
          <CardHeader trailing={<Pill tone="success">ядро</Pill>}>
            Backend API
          </CardHeader>
          <CardBody>
            <Stack gap={6}>
              <Text size="small">User по телефону + Telegram id</Text>
              <Text size="small">Базы и credentials: user × base, шифрование</Text>
              <Text size="small">Прокси OData; при 401 — сигнал re-auth в Mini App</Text>
            </Stack>
          </CardBody>
        </Card>
        <Card>
          <CardHeader trailing={<Pill tone="info">весь UI</Pill>}>
            Mini App
          </CardHeader>
          <CardBody>
            <Stack gap={6}>
              <Text size="small">CRUD своих баз + форма OData-логина</Text>
              <Text size="small">Повторный вход при смене пароля 1С</Text>
              <Text size="small">Фонды и остальные сценарии</Text>
            </Stack>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>1С OData</CardHeader>
          <CardBody>
            <Stack gap={6}>
              <Text size="small">Проверка учётки при add/re-auth базы</Text>
              <Text size="small">Запросы — credentials этой базы</Text>
              <Text size="small" tone="tertiary">
                Права на данные — на стороне 1С
              </Text>
            </Stack>
          </CardBody>
        </Card>
      </Grid>

      <Stack gap={8}>
        <H2>Модель данных (контур)</H2>
        <Table
          headers={["Сущность", "Ключ", "Поля / смысл"]}
          rows={[
            ["User", "phone, telegram_id", "Создаётся при первом share contact"],
            [
              "BaseConnection",
              "user_id + base_id",
              "name, odata_url; принадлежит пользователю",
            ],
            [
              "ODataCredential",
              "user_id + base_id",
              "login + password (encrypted); 1:1 с базой",
            ],
            ["Session", "user", "Telegram initData → наш токен"],
          ]}
        />
      </Stack>

      <Divider />

      <Stack gap={8}>
        <H3>MVP</H3>
        <Row gap={8} style={{ flexWrap: "wrap" }}>
          <Pill tone="info">Бот: телефон</Pill>
          <Pill tone="info">Mini App: добавить базу</Pill>
          <Pill tone="info">OData 1× / re-auth</Pill>
          <Pill tone="info">Фонды</Pill>
        </Row>
        <Text size="small" tone="secondary">
          Админки для реестра нет: пользователь сам добавляет базы и учётки в Mini
          App. На каждую базу — свои credentials.
        </Text>
        <Text size="small" tone="tertiary" style={mergeStyle({ marginTop: 4 })}>
          Источник: ответы по архитектуре · все решения закрыты
        </Text>
      </Stack>
    </Stack>
  );
}
