
数据持久化设计方案：


**准备工作**

1. 在 Supabase 创建一个新表 `anki_records`，结构如下：

```sql
create table anki_records (
  id uuid default gen_random_uuid() primary key,
  date date not null unique,
  duration numeric not null,
  cards integer not null,
  avg_seconds numeric not null,
  retry_count integer not null,
  retry_percent numeric not null,
  learn integer not null,
  review integer not null,
  relearn integer not null,
  filtered integer not null,
  created_at timestamp with time zone default now()
);

-- 开启 RLS 但允许匿名访问（简单方案）
alter table anki_records enable row level security;

create policy "Allow all access" on anki_records
  for all using (true) with check (true);
```

2. 获取你的 Supabase 配置：
   * **Project URL** ：类似 `https://xxxxx.supabase.co`
   * **Anon Key** ：在 Settings → API 里找到
