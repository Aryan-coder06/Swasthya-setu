-- Ensure lowercase table exists (the backend queries public.hospitals)
create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  state text,
  postal_code text,
  phone text,
  latitude double precision,
  longitude double precision,
  rating numeric(2,1),
  review_count integer,
  type text,
  consultation_fee_min integer,
  consultation_fee_max integer,
  specialties text[],
  facilities text[],
  beds_total integer,
  beds_available integer,
  opening_hours text,
  image_url text,
  source text,
  created_at timestamptz default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'hospitals_name_city_key'
  ) then
    alter table public.hospitals
      add constraint hospitals_name_city_key unique (name, city);
  end if;
end$$;

with base_locations as (
  select *
  from (values
    ('Andhra Pradesh',       'Visakhapatnam',     17.6868, 83.2185, '+91-891-27'),
    ('Arunachal Pradesh',    'Itanagar',          27.0844, 93.6053, '+91-360-22'),
    ('Assam',                'Guwahati',          26.1445, 91.7362, '+91-361-25'),
    ('Bihar',                'Patna',             25.5941, 85.1376, '+91-612-22'),
    ('Chhattisgarh',         'Raipur',            21.2514, 81.6296, '+91-771-40'),
    ('Delhi',                'New Delhi',         28.6139, 77.2090, '+91-11-40'),
    ('Goa',                  'Panaji',            15.4909, 73.8278, '+91-832-24'),
    ('Gujarat',              'Ahmedabad',         23.0225, 72.5714, '+91-79-66'),
    ('Haryana',              'Gurugram',          28.4595, 77.0266, '+91-124-49'),
    ('Himachal Pradesh',     'Shimla',            31.1048, 77.1734, '+91-177-26'),
    ('Jammu and Kashmir',    'Srinagar',          34.0837, 74.7973, '+91-194-22'),
    ('Jharkhand',            'Ranchi',            23.3441, 85.3096, '+91-651-35'),
    ('Karnataka',            'Bengaluru',         12.9716, 77.5946, '+91-80-25'),
    ('Kerala',               'Thiruvananthapuram', 8.5241, 76.9366, '+91-471-37'),
    ('Madhya Pradesh',       'Bhopal',            23.2599, 77.4126, '+91-755-29'),
    ('Maharashtra',          'Mumbai',            19.0760, 72.8777, '+91-22-40'),
    ('Manipur',              'Imphal',            24.8170, 93.9368, '+91-385-24'),
    ('Meghalaya',            'Shillong',          25.5788, 91.8933, '+91-364-23'),
    ('Mizoram',              'Aizawl',            23.7271, 92.7176, '+91-389-23'),
    ('Nagaland',             'Kohima',            25.6751, 94.1086, '+91-370-22'),
    ('Odisha',               'Bhubaneswar',       20.2961, 85.8245, '+91-674-25'),
    ('Punjab',               'Amritsar',          31.6340, 74.8723, '+91-183-45'),
    ('Rajasthan',            'Jaipur',            26.9124, 75.7873, '+91-141-27'),
    ('Sikkim',               'Gangtok',           27.3389, 88.6065, '+91-3592-2'),
    ('Tamil Nadu',           'Chennai',           13.0827, 80.2707, '+91-44-40'),
    ('Telangana',            'Hyderabad',         17.3850, 78.4867, '+91-40-44'),
    ('Tripura',              'Agartala',          23.8315, 91.2868, '+91-381-23'),
    ('Uttar Pradesh',        'Lucknow',           26.8467, 80.9462, '+91-522-40'),
    ('Uttarakhand',          'Dehradun',          30.3165, 78.0322, '+91-135-26'),
    ('West Bengal',          'Kolkata',           22.5726, 88.3639, '+91-33-40')
  ) as t(state, city, base_lat, base_lng, phone_prefix)
),
expanded as (
  select
    state,
    city,
    base_lat,
    base_lng,
    phone_prefix,
    gs,
    row_number() over (partition by state order by gs) as state_rank
  from base_locations
  cross join generate_series(1, 50) as gs
),
payload as (
  select
    format('%s Medical Center %s', city, gs) as name,
    format('%s Health District %s, %s', city, 200 + gs, state) as address,
    city,
    state,
    format('%06s', 400000 + gs) as postal_code,
    format('%s%04s', phone_prefix, gs) as phone,
    base_lat + 0.015 * cos(gs / 3.0) as latitude,
    base_lng + 0.015 * sin(gs / 4.0) as longitude,
    round( (3.5 + random() * 1.5)::numeric, 1) as rating,
    450 + gs * 9 as review_count,
    case when gs % 6 = 0 then 'Specialty' when gs % 5 = 0 then 'Government' else 'Multi-specialty' end as type,
    300 + ((gs % 8) * 40) as consultation_fee_min,
    600 + ((gs % 8) * 55) as consultation_fee_max,
    case
      when gs % 5 = 0 then array['Cardiology','Oncology','Critical Care']
      when gs % 4 = 0 then array['Neurology','Orthopedics','Rehabilitation']
      when gs % 3 = 0 then array['Pediatrics','Obstetrics','Neonatology']
      else array['General Medicine','Emergency','Diagnostics']
    end as specialties,
    case
      when gs % 6 = 0 then array['Emergency','ICU','Blood Bank','Lab','Cafe','Parking','WiFi']
      when gs % 4 = 0 then array['Emergency','ICU','Dialysis','Pharmacy','Cafe','Parking']
      else array['Emergency','ICU','Pharmacy','Lab','Parking']
    end as facilities,
    220 + (gs % 12) * 25 as beds_total,
    40 + (gs % 8) * 12 as beds_available,
    '24/7' as opening_hours,
    case
      when gs % 4 = 0 then 'https://images.pexels.com/photos/668300/pexels-photo-668300.jpeg?auto=compress&cs=tinysrgb&w=800'
      when gs % 3 = 0 then 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=800'
      else 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800'
    end as image_url,
    'synthetic-seed' as source
  from expanded
)
insert into public.hospitals (
  name,
  address,
  city,
  state,
  postal_code,
  phone,
  latitude,
  longitude,
  rating,
  review_count,
  type,
  consultation_fee_min,
  consultation_fee_max,
  specialties,
  facilities,
  beds_total,
  beds_available,
  opening_hours,
  image_url,
  source
)
select *
from payload
on conflict (name, city) do nothing;
