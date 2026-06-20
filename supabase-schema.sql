create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  account_type text not null default 'customer' check (account_type in ('customer', 'creator')),
  username text unique,
  display_name text not null default '',
  bio text not null default '',
  city text not null default '',
  social_url text not null default '',
  verification_status text not null default 'not_required' check (verification_status in ('not_required', 'pending', 'verified', 'rejected')),
  stripe_account_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  price numeric(10, 2) not null check (price > 0),
  platforms text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  customer_id uuid references public.profiles(id) on delete set null,
  slot_id uuid not null references public.slots(id) on delete cascade,
  business_name text not null,
  business_email text not null,
  proposal_details text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'completed')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'pending', 'paid')),
  checkout_session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.slots enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "profiles are publicly readable" on public.profiles;
create policy "profiles are publicly readable"
on public.profiles for select
using (true);

drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "active slots are publicly readable" on public.slots;
create policy "active slots are publicly readable"
on public.slots for select
using (is_active = true or auth.uid() = user_id);

drop policy if exists "creators can insert own slots" on public.slots;
create policy "creators can insert own slots"
on public.slots for insert
with check (auth.uid() = user_id);

drop policy if exists "creators can update own slots" on public.slots;
create policy "creators can update own slots"
on public.slots for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "creators can delete own slots" on public.slots;
create policy "creators can delete own slots"
on public.slots for delete
using (auth.uid() = user_id);

drop policy if exists "booking participants can read bookings" on public.bookings;
create policy "booking participants can read bookings"
on public.bookings for select
using (auth.uid() = creator_id or auth.uid() = customer_id);

drop policy if exists "customers can insert own bookings" on public.bookings;
create policy "customers can insert own bookings"
on public.bookings for insert
with check (auth.uid() = customer_id);

drop policy if exists "booking participants can update bookings" on public.bookings;
create policy "booking participants can update bookings"
on public.bookings for update
using (auth.uid() = creator_id or auth.uid() = customer_id)
with check (auth.uid() = creator_id or auth.uid() = customer_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists slots_set_updated_at on public.slots;
create trigger slots_set_updated_at
before update on public.slots
for each row execute function public.set_updated_at();

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();
