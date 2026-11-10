-- Reference data. Safe to run more than once.
-- Only Jorhat is switched on. Other towns exist but stay off until launch there.

insert into public.towns (name, district, is_active, pickup_days) values
  ('Jorhat',    'Jorhat',  true,  'Every day'),
  ('Guwahati',  'Kamrup Metropolitan', false, null),
  ('Dibrugarh', 'Dibrugarh', false, null),
  ('Tezpur',    'Sonitpur', false, null),
  ('Silchar',   'Cachar',   false, null),
  ('Nagaon',    'Nagaon',   false, null)
on conflict (name) do nothing;

-- Jorhat pincodes. CHECK THIS LIST against India Post before launch;
-- add or remove rows, and set is_active for the areas we actually serve.
insert into public.pincodes (pincode, town_id, area_name, is_active)
select v.pincode, t.id, v.area, true
from (values
  ('785001', 'Jorhat town'),
  ('785004', null),
  ('785005', null),
  ('785006', null),
  ('785007', null),
  ('785008', null),
  ('785010', null),
  ('785014', null)
) as v(pincode, area)
cross join public.towns t where t.name = 'Jorhat'
on conflict (pincode) do nothing;

insert into public.material_categories (slug, name) values
  ('paper', 'Paper'), ('metal', 'Metal'), ('plastic', 'Plastic'), ('ewaste', 'Appliances')
on conflict (slug) do nothing;

insert into public.materials (slug, name, category_id, unit, sort_order)
select v.slug, v.name, c.id, v.unit::public.material_unit, v.ord
from (values
  ('newspaper',    'Newspaper',        'paper',   'kg', 1),
  ('cardboard',    'Cardboard',        'paper',   'kg', 2),
  ('books',        'Books and copies', 'paper',   'kg', 3),
  ('iron',         'Iron',             'metal',   'kg', 4),
  ('steel',        'Steel utensils',   'metal',   'kg', 5),
  ('aluminium',    'Aluminium',        'metal',   'kg', 6),
  ('brass',        'Brass',            'metal',   'kg', 7),
  ('copper',       'Copper',           'metal',   'kg', 8),
  ('pet',          'PET bottles',      'plastic', 'kg', 9),
  ('hard-plastic', 'Hard plastic',     'plastic', 'kg', 10),
  ('ac',           'Split AC',         'ewaste',  'pc', 11),
  ('fridge',       'Refrigerator',     'ewaste',  'pc', 12),
  ('washer',       'Washing machine',  'ewaste',  'pc', 13),
  ('laptop',       'Laptop',           'ewaste',  'pc', 14)
) as v(slug, name, cat, unit, ord)
join public.material_categories c on c.slug = v.cat
on conflict (slug) do nothing;

-- Starting Jorhat rates (same sample numbers as the website; update before launch).
insert into public.material_rates (town_id, material_id, price_per_unit)
select t.id, m.id, v.price
from (values
  ('newspaper', 14), ('cardboard', 10), ('books', 12), ('iron', 28), ('steel', 40),
  ('aluminium', 105), ('brass', 300), ('copper', 410), ('pet', 15), ('hard-plastic', 12),
  ('ac', 3800), ('fridge', 1200), ('washer', 900), ('laptop', 250)
) as v(slug, price)
join public.materials m on m.slug = v.slug
cross join public.towns t
where t.name = 'Jorhat'
  and not exists (select 1 from public.material_rates r where r.town_id = t.id and r.material_id = m.id and r.effective_to is null);
