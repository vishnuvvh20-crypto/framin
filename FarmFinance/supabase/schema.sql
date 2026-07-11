-- Supabase PostgreSQL Schema for FarmFinance

-- ENUMS
CREATE TYPE user_role AS ENUM ('owner', 'farmhand', 'accountant');
CREATE TYPE transaction_type AS ENUM ('income', 'expense');

-- USERS TABLE (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name TEXT,
  role user_role DEFAULT 'farmhand' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FARMS TABLE
CREATE TABLE public.farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRANSACTIONS TABLE
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES public.farms(id) NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  type transaction_type NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  vendor TEXT,
  category TEXT NOT NULL,
  notes TEXT,
  receipt_url TEXT,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete for offline sync support
);

-- BUDGETS TABLE
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES public.farms(id) NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  season TEXT,   -- e.g., 'Spring 2024'
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVENTORY TABLE
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES public.farms(id) NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Seeds', 'Fertilizers', 'Chemicals'
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,     -- 'kg', 'liters', 'bags'
  low_stock_threshold DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) ENABLED
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- SIMPLE POLICIES (Assuming Farm Isolation)
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);

-- Owners can do everything on their farm
CREATE POLICY "Owner Farm Access" ON public.farms FOR ALL USING (auth.uid() = owner_id);

-- Everyone on the farm can read/write sync (simplified, in real world we join farms-users)
-- (We assume farm_id is somehow linked or passed. For template, allow authenticated:)
CREATE POLICY "Authenticated users can sync transactions" ON public.transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can sync budgets" ON public.budgets FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can sync inventory" ON public.inventory FOR ALL USING (auth.role() = 'authenticated');

-- FUNCTIONS & TRIGGERS
-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_transactions
BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_inventory
BEFORE UPDATE ON public.inventory
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
