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
  { id: "api", label: "Backend", sub: "ACL + OData" },
  { id: "mini", label: "Mini App", sub: "базы · ACL · UI" },
  { id: "odata", label: "1С OData", sub: "единый логин" },
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
          ACL по телефонам, единый OData-логин на базу (только owner), хостинг
          melnichuk.kz / CT200.
        </Text>
      </Stack>

      <Callout tone="success">
        Решения закрыты, включая шаринг: только ACL, credentials только у владельца.
      </Callout>

      <Grid columns={3} gap={12}>
        <Stat value="ACL" label="доступ по телефону" />
        <Stat value="1 login" label="OData на базу" />
        <Stat value="Owner" label="меняет вход и ACL" />
      </Grid>

      <Stack gap={8}>
        <H2>Зафиксировано</H2>
        <Table
          headers={["Вопрос", "Решение"]}
          rows={[
            ["Телефон", "Свой бэкенд"],
            ["OData", "Один логин на базу; хранит backend; пишет только owner"],
            ["Бот", "Только телефон → Mini App"],
            ["Базы", "Self-service в Mini App"],
            ["Шаринг", "ACL: owner добавляет телефоны"],
            ["Гость", "Видит базу и работает; не меняет вход/ACL"],
            ["Re-auth", "Только owner при смене пароля 1С"],
            ["Хостинг", "CT200 + Cloudflare + *.melnichuk.kz"],
          ]}
          rowTone={[
            "success",
            "success",
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
              OData всегда учёткой владельца базы. ACL только открывает UI/прокси.
            </Text>
          </CardBody>
        </Card>
      </Stack>

      <Stack gap={8}>
        <H2>ACL</H2>
        <Table
          headers={["Кто", "Может"]}
          rows={[
            ["Owner", "Создать базу, credentials, ACL, re-auth, работа"],
            ["Телефон в ACL", "Видеть базу, работать через прокси"],
            ["Чужой номер", "Базы не видит"],
          ]}
        />
        <Text size="small" tone="secondary">
          Список баз = где я owner ∪ куда добавлен мой телефон.
        </Text>
      </Stack>

      <Stack gap={8}>
        <H2>Сценарий</H2>
        <Table
          headers={["Шаг", "Где", "Что"]}
          rows={[
            ["1", "Бот", "Номер → user в backend"],
            ["2", "Бот", "Открыть Mini App"],
            ["3", "Mini App", "Owner: база + OData → проверка → save"],
            ["4", "Mini App", "Owner: добавить телефоны в ACL"],
            ["5", "Mini App", "Гость с ACL: база в списке → фонды"],
            ["6", "Mini App", "Owner: 401 → re-auth OData"],
          ]}
        />
      </Stack>

      <H2>Модель данных</H2>
      <Table
        headers={["Сущность", "Ключ", "Смысл"]}
        rows={[
          ["User", "phone, telegram_id", "После share contact"],
          ["Base", "id, owner_user_id", "name, odata_url"],
          [
            "ODataCredential",
            "base_id",
            "login/password encrypted; только owner",
          ],
          ["BaseAccess", "base_id + phone", "ACL"],
          ["Session", "user", "initData → токен"],
        ]}
      />

      <Divider />

      <Stack gap={8}>
        <H3>MVP</H3>
        <Row gap={8} style={{ flexWrap: "wrap" }}>
          <Pill tone="info">Бот: телефон</Pill>
          <Pill tone="info">База + OData</Pill>
          <Pill tone="info">ACL телефоны</Pill>
          <Pill tone="info">Фонды</Pill>
        </Row>
        <Text size="small" tone="tertiary" style={mergeStyle({ marginTop: 4 })}>
          Обновлено: ACL + единый логин + melnichuk.kz
        </Text>
      </Stack>
    </Stack>
  );
}
