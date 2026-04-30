-- ============================================================
-- 番茄学习 App - Supabase 数据库结构
-- 在 Supabase Dashboard → SQL Editor 中执行此文件
-- ============================================================

-- 用户档案表（关联 Supabase Auth）
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  role text default 'child' check (role in ('child', 'parent')),
  created_at timestamptz default now()
);

-- 番茄会话记录（每个25分钟专注记录一条）
create table if not exists pomodoro_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  mode text not null check (mode in ('focus', 'short_break', 'long_break')),
  started_at timestamptz not null,
  ended_at timestamptz,
  completed boolean default false,
  interrupted boolean default false,
  date date default current_date,
  created_at timestamptz default now()
);

-- 任务表
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  text text not null,
  emoji text default '📚',
  estimated_pomodoros int default 2,
  completed_pomodoros int default 0,
  done boolean default false,
  created_at timestamptz default now(),
  done_at timestamptz,
  date date default current_date
);

-- 打断记录
create table if not exists interruptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  session_id uuid references pomodoro_sessions(id) on delete set null,
  type text default 'internal' check (type in ('internal', 'external')),
  note text,
  created_at timestamptz default now()
);

-- 贴纸/奖励记录
create table if not exists stickers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  emoji text not null,
  earned_at timestamptz default now(),
  pomodoros_at_earn int
);

-- ============================================================
-- Row Level Security（RLS）
-- ============================================================

alter table profiles enable row level security;
alter table pomodoro_sessions enable row level security;
alter table tasks enable row level security;
alter table interruptions enable row level security;
alter table stickers enable row level security;

-- profiles: 用户只能查看和修改自己的资料
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

-- pomodoro_sessions: 用户只能操作自己的数据
create policy "Users manage own sessions" on pomodoro_sessions
  for all using (auth.uid() = user_id);

-- tasks: 用户只能操作自己的数据
create policy "Users manage own tasks" on tasks
  for all using (auth.uid() = user_id);

-- interruptions
create policy "Users manage own interruptions" on interruptions
  for all using (auth.uid() = user_id);

-- stickers
create policy "Users manage own stickers" on stickers
  for all using (auth.uid() = user_id);

-- ============================================================
-- 视图：每日统计（方便数据分析）
-- ============================================================

create or replace view daily_stats as
select
  ps.user_id,
  ps.date,
  p.username,
  count(*) filter (where ps.mode = 'focus' and ps.completed = true) as completed_pomodoros,
  count(*) filter (where ps.mode = 'focus' and ps.completed = true) * 25 as focus_minutes,
  count(*) filter (where ps.interrupted = true) as interrupted_sessions,
  (select count(*) from interruptions i where i.user_id = ps.user_id and date(i.created_at) = ps.date) as total_interruptions,
  (select count(*) from stickers s where s.user_id = ps.user_id and date(s.earned_at) = ps.date) as stickers_earned,
  (select count(*) from tasks t where t.user_id = ps.user_id and t.date = ps.date and t.done = true) as tasks_completed
from pomodoro_sessions ps
join profiles p on p.id = ps.user_id
group by ps.user_id, ps.date, p.username;

-- ============================================================
-- 活动记录日志 (Activity Log)
-- ============================================================
create table if not exists user_activities (
  id uuid default gen_random_uuid() primary key,
  username text not null,
  type text not null,
  message text not null,
  created_at timestamptz default now()
);

-- 允许匿名/普通插入 (如果未使用Supabase Auth，可以跳过RLS)
-- alter table user_activities enable row level security;
-- create policy "Allow insert for all" on user_activities for insert with check (true);
