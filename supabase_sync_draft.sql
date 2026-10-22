-- ==============================================================================
-- DỰ THẢO ĐỒNG BỘ 249 HỌC SINH CHÍNH THỨC SANG SUPABASE CLOUD
-- Hệ thống: Smart ICT Classroom AI - Trường Tiểu học Đồng Dương
-- Ghi chú: Script này thiết kế theo chuẩn bảo mật, KHÔNG chứa mã PIN dạng rõ (plaintext).
-- ==============================================================================

-- BƯỚC 1: SAO LƯU TOÀN BỘ 12 HỌC SINH MẪU CŨ (BẢO TOÀN DỮ LIỆU)
CREATE TABLE IF NOT EXISTS public.students_backup_old AS 
SELECT * FROM public.students;

COMMENT ON TABLE public.students_backup_old IS 'Bản sao lưu 12 học sinh mẫu cũ trước khi đồng bộ 249 học sinh chính thức ngày 2026-10-20';

-- BƯỚC 2: CẬP NHẬT CẤU TRÚC BẢNG PUBLIC.STUDENTS (MỞ RỘNG AN TOÀN)
-- Thêm các cột chuẩn hóa nếu chưa có
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS class_code VARCHAR(10);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS gender VARCHAR(10);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS seat_number INTEGER;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS assigned_pc VARCHAR(10);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS hashed_pin VARCHAR(128);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS must_change_pin BOOLEAN DEFAULT true;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS pin_updated_at TIMESTAMPTZ DEFAULT NOW();

-- Đảm bảo cột code có ràng buộc duy nhất để chống trùng lặp dữ liệu
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_code_unique'
  ) THEN
    ALTER TABLE public.students ADD CONSTRAINT students_code_unique UNIQUE (code);
  END IF;
END $$;

-- BƯỚC 3: ĐỒNG BỘ 249 HỌC SINH CHÍNH THỨC (CƠ CHẾ UPSERT CHỐNG TRÙNG LẶP)
INSERT INTO public.students (
  code,
  name,
  gender,
  class_code,
  seat_number,
  assigned_pc,
  seat,
  hashed_pin,
  status
)
VALUES
  ('HS43-01', 'Nguyễn Ngọc Bảo Anh', 'female', '4.3', 1, 'PC01', 'Máy-01', 'ac5be2ed849bc60ad04729672728b07122d35e209ae7aaf43fc5be85bfb7f7e3', 'active'),
  ('HS43-02', 'Nguyễn Phan Ngọc Bảo', 'male', '4.3', 2, 'PC02', 'Máy-02', '724637cb8c3ef8bb17e5eb14689f6a2415873e92d76c79648c5b31101f938176', 'active'),
  ('HS43-03', 'Trần Gia Bảo', 'male', '4.3', 3, 'PC03', 'Máy-03', 'c9b29e8d011b063415ab6e1a791e088bff07322d491793ecea8620e0279e32bd', 'active'),
  ('HS43-04', 'Lê Thị Bảo Châu', 'female', '4.3', 4, 'PC04', 'Máy-04', 'a06d032ba73c4453dcd4cfa00e0be59ee2852d45aa7f0e9406ae8baf6b7c86f6', 'active'),
  ('HS43-05', 'Nguyễn Thanh Dương', 'female', '4.3', 5, 'PC05', 'Máy-05', '63db458b3b3b0dd8992e66209c002a853678858b794f4b40d2a56915d76fcdfa', 'active'),
  ('HS43-06', 'Trần Anh Đức', 'male', '4.3', 6, 'PC06', 'Máy-06', '09c5b49517ea935c2e5ae492f4236e8d170a48d7f791f71b79b85c032f8f9bb9', 'active'),
  ('HS43-07', 'Trần Văn Hà', 'male', '4.3', 7, 'PC07', 'Máy-07', '945ab3c6cd25e21a33e01c2a2a37f5648cd118d764cfd0717b4333a8fbe9c0cf', 'active'),
  ('HS43-08', 'Phan Trương Gia Hân', 'female', '4.3', 8, 'PC08', 'Máy-08', 'f7e90037ba3bb42201e83f2e182fa442d4203c8a032de87fd9b2670127001565', 'active'),
  ('HS43-09', 'Võ Gia Hân', 'female', '4.3', 9, 'PC09', 'Máy-09', '410ba7cb3c313bbed2695c2948aec598764f51486b8d8607a9337c3b42400c29', 'active'),
  ('HS43-10', 'Nguyễn Tấn Nguyên Khang', 'male', '4.3', 10, 'PC10', 'Máy-10', '7f6980dd63b4a78d63fe9ce884b39974a2e7fc6236166e6c7a22d42c16d535fe', 'active'),
  ('HS43-11', 'Nguyễn Nhật Minh', 'male', '4.3', 11, 'PC11', 'Máy-11', '78dd91ce3bf557719e798d616ad751005192470116c8381beab715148a320055', 'active'),
  ('HS43-12', 'Đặng Khánh Ngân', 'female', '4.3', 12, 'PC12', 'Máy-12', '6791179732759810f1d875474b81ff744eb3e786fb8f74d5b5de41d9da6f1f14', 'active'),
  ('HS43-13', 'Hồ Kim Ngân', 'female', '4.3', 13, 'PC13', 'Máy-13', 'f7d6d54930451aaaa772aa393cd7c5f4be57840e30e403201112cebbb12b89b5', 'active'),
  ('HS43-14', 'Phan Thị Kim Ngân', 'female', '4.3', 14, 'PC14', 'Máy-14', 'a508313cbb7cfdb55abf0e422d6d5511feaecd09f43df89e283266f00caf472c', 'active'),
  ('HS43-15', 'Vũ Hoàng Bảo Ngọc', 'female', '4.3', 15, 'PC15', 'Máy-15', '6406c423acd7a5d268def06fd17ca192bd588c72a50a091baaa37e41800d8ff8', 'active'),
  ('HS43-16', 'Lê Khôi Nguyên', 'female', '4.3', 16, 'PC16', 'Máy-16', '3f8be0473b93bccf1c75ab7a2734686ddddae678b9d20cd064da2d7b458de894', 'active'),
  ('HS43-17', 'Nguyễn Ngọc Thảo Nguyên', 'female', '4.3', 17, 'PC17', 'Máy-17', '6c846c81ab71492f973dc695ec7c547db037922a9c9b84bf105d5860bf592bde', 'active'),
  ('HS43-18', 'Bùi Võ Tấn Sang', 'male', '4.3', 18, 'PC18', 'Máy-18', 'b1ddc1379c0a468345672ea1b32d04bb726a17b2738867b6a6f984c76b1d0ebe', 'active'),
  ('HS43-19', 'Trương Nguyễn Sang', 'male', '4.3', 19, 'PC19', 'Máy-19', '6bddc3fbfb1282d62a326b5546ecf321038e53ef10fe76678527675a14993432', 'active'),
  ('HS43-20', 'Vương Thị Thanh Thuý', 'female', '4.3', 20, 'PC20', 'Máy-20', '7afc3da162c4830a7a22f5c36b5048452c870e6ded4cd0e447cc33d5c14c06cf', 'active'),
  ('HS43-21', 'Lê Bảo Thy', 'male', '4.3', 21, 'PC01', 'Máy-01', 'dee9e673775daf64fa7824466585f3143510d97957fe59feae99b944b20a2010', 'active'),
  ('HS43-22', 'Tô Bảo Trang', 'female', '4.3', 22, 'PC02', 'Máy-02', 'd1c868716477af5f71fc6f5019d79dc051eb037ab32b6f2d03525d5e2bbe9317', 'active'),
  ('HS43-23', 'Tô Bảo Trâm', 'female', '4.3', 23, 'PC03', 'Máy-03', '3cbd170a1c5227f9c1ecd4a1b65cf0fa4f3b470ce8a3ac88b2004ed34d969836', 'active'),
  ('HS43-24', 'Phùng Thanh Tú', 'male', '4.3', 24, 'PC04', 'Máy-04', '4d65391d622e867ea343549daa5735fb82230d62118c00a299b859393b1da95c', 'active'),
  ('HS43-25', 'Trần Ngọc Anh Tuấn', 'male', '4.3', 25, 'PC05', 'Máy-05', '553193c8a13499e2e98e8277ce7a387fb5474a31d0aae1366c4416661fc7d1d2', 'active'),
  ('HS43-26', 'Bùi Trần Nhã Uyên', 'female', '4.3', 26, 'PC06', 'Máy-06', '17fbd5f9dfeeb276495c3c9722a8fd0756c3c0994b29c5a6d0a2331171c55f45', 'active'),
  ('HS43-27', 'Nguyễn Đức Khôi Vĩ', 'male', '4.3', 27, 'PC07', 'Máy-07', '9263864d5658d0d4763ef9c0d27745a6f5eb315973830f7cae711452f8706d42', 'active'),
  ('HS43-28', 'Nguyễn Phạm Tường Vy', 'female', '4.3', 28, 'PC08', 'Máy-08', '6b9f80966360013cd58eef7535a7e0a4eece13b1bfcbd5734c2cd1d27954db97', 'active'),
  ('HS43-29', 'Phạm Thị Tường Vy', 'female', '4.3', 29, 'PC09', 'Máy-09', '427b7c8465eae2eb6ad426f8649416f2a0954328e591230b8d07e3fea132fc1c', 'active'),
  ('HS44-01', 'Trà Quốc Bảo', 'male', '4.4', 1, 'PC01', 'Máy-01', 'feb7418f19d42b2e9fe680cb72474540ccaaa20d18b0a3437b9ec0653855c188', 'active'),
  ('HS44-02', 'Lê Viết Công', 'male', '4.4', 2, 'PC02', 'Máy-02', '6c93bd96077b4b2baf35abffeb486013cb09c19b4946c6fe4bea34ab3b567cf1', 'active'),
  ('HS44-03', 'Trương Văn Dũng', 'male', '4.4', 3, 'PC03', 'Máy-03', '28af90bcaeec44e4cac40867a7d390481f04a96be5c3d1f2c0a3812e847152dc', 'active'),
  ('HS44-04', 'Thái Khánh Duy', 'male', '4.4', 4, 'PC04', 'Máy-04', '291404743b5cfd60e924defcd7f5fe0ceddff40d8d549928f0b71b8061158bca', 'active'),
  ('HS44-05', 'Trần Hữu Quốc Đạt', 'male', '4.4', 5, 'PC05', 'Máy-05', '62d907a4b85035b4fbfca38ccc770b9c6c69588ca5f03bc64fc7d06c90646775', 'active'),
  ('HS44-06', 'Nguyễn Ngọc Nhã Hân', 'female', '4.4', 6, 'PC06', 'Máy-06', '034af0c117e3acdc6d2fa0501e37dfc02eb5c374b342a828551586e336551f0c', 'active'),
  ('HS44-07', 'Võ Văn Gia Huy', 'male', '4.4', 7, 'PC07', 'Máy-07', '5ed99e56e708982d64b92ffa8428c8827623882666abeef013ae798586e73b9b', 'active'),
  ('HS44-08', 'Nguyễn Văn Hữu', 'male', '4.4', 8, 'PC08', 'Máy-08', '02fb5153d3c873fd3b3e2cb60c50ed6ad3c5a8cd4456fc012dc621435b582706', 'active'),
  ('HS44-09', 'Huỳnh Nguyên Khang', 'male', '4.4', 9, 'PC09', 'Máy-09', 'fb50b09a16431ee7836abd13d3b2c8608b8f0dcf00249ff9ed8c7c37fdb31fa9', 'active'),
  ('HS44-10', 'Nguyễn Hữu Khang', 'male', '4.4', 10, 'PC10', 'Máy-10', 'd3c49576adcc7072be10e7973d0f8029be1da01fed150e20e7aa8d942c681ef5', 'active'),
  ('HS44-11', 'Trần Phúc Lâm', 'male', '4.4', 11, 'PC11', 'Máy-11', '6e8f9a271ab6697375f38ea77b47a502f59c013e1c2aca5eaffaddf67ff961e0', 'active'),
  ('HS44-12', 'Nguyễn Vũ Bảo Long', 'male', '4.4', 12, 'PC12', 'Máy-12', 'b697da598925c30629e62aa58c34fb7ec4c65bce0213e639b865cf627cfe0a0e', 'active'),
  ('HS44-13', 'Trà Cao Bảo Long', 'male', '4.4', 13, 'PC13', 'Máy-13', '09fbb6c9040c76c6320b79fa052a2c4243392ba9becbabc984a687ab4859d518', 'active'),
  ('HS44-14', 'Lê Thị Khánh Ly', 'female', '4.4', 14, 'PC14', 'Máy-14', '3a33f3cdda870ca8e654a32db5e04dedb67b94acd624638e726d18dd999e111c', 'active'),
  ('HS44-15', 'Nguyễn Thảo My', 'female', '4.4', 15, 'PC15', 'Máy-15', 'e5220291c76f432a1e54a8d438d067d183b26baf55173e2f07815dad41febab2', 'active'),
  ('HS44-16', 'Nguyễn Khánh Như', 'female', '4.4', 16, 'PC16', 'Máy-16', '4a3ba99379548113ca9330af2f5a8201f3447be0407e2bdf01fded3149e551b8', 'active'),
  ('HS44-17', 'Trần Nguyễn Kim Như', 'female', '4.4', 17, 'PC17', 'Máy-17', '14f00ea220ce07d3913045a0302971096189c98953efaecea3b186d13ad58c1a', 'active'),
  ('HS44-18', 'Võ Quỳnh Như', 'female', '4.4', 18, 'PC18', 'Máy-18', '3ac2697dc2b5c161a692a66ab3d6346b88ab77201cb0588ef3754caeeaa7ec60', 'active'),
  ('HS44-19', 'Nguyễn Nhật Quốc', 'male', '4.4', 19, 'PC19', 'Máy-19', '7569f23b9a724e6f68f5a864ba8fc0d4679e147ee50f9ef40b8e6697f049867c', 'active'),
  ('HS44-20', 'Nguyễn Thị Bảo Quyên', 'female', '4.4', 20, 'PC20', 'Máy-20', 'd0777cb327dc51da62a763ed709c9d2a1f7ff7b53b7d5e940b1fc8a538e0d271', 'active'),
  ('HS44-21', 'Mai Tấn Tài', 'male', '4.4', 21, 'PC01', 'Máy-01', '97e0dc5681059d65074445d589c7138b1cd8c90da6d2b4b3ceae628ecacc0e44', 'active'),
  ('HS44-22', 'Nguyễn Quang Thịnh', 'male', '4.4', 22, 'PC02', 'Máy-02', '35fbf40dd8e0e852475fd5404ebca1614856731e9efa03a19aa800166d1b5a4f', 'active'),
  ('HS44-23', 'Thái Tấn Thông', 'male', '4.4', 23, 'PC03', 'Máy-03', '9d14d1be3dd9206576f803811a976ca4ecc8914c9f7957fe4683b309fef8e761', 'active'),
  ('HS44-24', 'Nguyễn Đức Trung Tín', 'male', '4.4', 24, 'PC04', 'Máy-04', '21df712f284b2dd1d79ed9d155a8d7f76d3255641a6253360b9347f7b42992f1', 'active'),
  ('HS44-25', 'Trương Huỳnh Bảo Toàn', 'male', '4.4', 25, 'PC05', 'Máy-05', '580f199754c3a8e933ab6947d9c918701240c8c7d59b036e7cc50947439cc98b', 'active'),
  ('HS44-26', 'Lê Trương Hạ Trâm', 'female', '4.4', 26, 'PC06', 'Máy-06', '6a5a08972924d6386f73292e45ec5ed780cf4418d09cb278ba13c7b776392fc2', 'active'),
  ('HS44-27', 'Võ Thị Thùy Trâm', 'female', '4.4', 27, 'PC07', 'Máy-07', '9790e810b292c498849d013d4b5468efc7e20baa3c9b675172e854fbd6547ee9', 'active'),
  ('HS44-28', 'Trương Thị Thanh Vân', 'female', '4.4', 28, 'PC08', 'Máy-08', 'f383e709c8057853255c806aa21e2b32125f8bc6db14dd868edc25c41a8078bf', 'active'),
  ('HS44-29', 'Nguyễn Quang Vương', 'male', '4.4', 29, 'PC09', 'Máy-09', '4284a04f5dbb614632efdb82f85a1ab6fde7c4c09ca0c2686cb3476acd2302a6', 'active'),
  ('HS45-01', 'Nguyễn Thị Trường An', 'female', '4.5', 1, 'PC01', 'Máy-01', 'b3fc66e0d55b72453300858dca8cd5f7dac051a82504542cf227617acda67dab', 'active'),
  ('HS45-02', 'Nguyễn Phi Gia Bảo', 'male', '4.5', 2, 'PC02', 'Máy-02', 'bd341632d390750e16b79c4389f3649806df85aea4e958fc28100c8b4ec318a4', 'active'),
  ('HS45-03', 'Nguyễn Mạnh Cường', 'male', '4.5', 3, 'PC03', 'Máy-03', '50806499611c2099f3d9f5023342beff36b236eb16c76191b5ab04f0918fd440', 'active'),
  ('HS45-04', 'Trần Quang Đại', 'male', '4.5', 4, 'PC04', 'Máy-04', 'c6bf42d490f5d335497db4fe0e37a839d18a2eecb42fa35337e3cc6491743e98', 'active'),
  ('HS45-05', 'Lưu Trương Linh Đan', 'female', '4.5', 5, 'PC05', 'Máy-05', '37d3c8314302e21d44c65b219ea9e4066e66b995c22eaeafda4dcf7ca9cc4c9b', 'active'),
  ('HS45-06', 'Nguyễn Công Kha', 'male', '4.5', 6, 'PC06', 'Máy-06', 'a569c9c226144d947c51985854ed659ed711a350fe5e343164798d712238db0b', 'active'),
  ('HS45-07', 'Trần Tuấn Kiệt', 'male', '4.5', 7, 'PC07', 'Máy-07', '6d35a424061e4030f5492b00a59bbdbdfbdca409e0915297a238094c82f9bc91', 'active'),
  ('HS45-08', 'Nguyễn Bảo Ngân', 'female', '4.5', 8, 'PC08', 'Máy-08', '831231bf644f96c403ce52bd2622afa41085dd7f216337a92d126f9ac97ebd2d', 'active'),
  ('HS45-09', 'Trần Lê Kim Ngân', 'female', '4.5', 9, 'PC09', 'Máy-09', 'ced78691593e651029350b0432c66be97aa828fc007db8a11f6329e7c48bb15e', 'active'),
  ('HS45-10', 'Trần Trọng Nhân', 'male', '4.5', 10, 'PC10', 'Máy-10', 'fc5776eaeb317a959780695657900e22fd060285b28f4b89bd659b038c8db6e0', 'active'),
  ('HS45-11', 'Nguyễn Thị Thanh Thảo', 'female', '4.5', 11, 'PC11', 'Máy-11', 'cae480c735cfcf3e298585ba0b6e3425a78ac3934a7c8f86166a58679db7e3a2', 'active'),
  ('HS45-12', 'Trần Thị Minh Thư', 'female', '4.5', 12, 'PC12', 'Máy-12', '116b5cddb95dadcc6e6c50cd3e77b38382ed384a71fbdd7a98c9527a16bfc4a8', 'active'),
  ('HS45-13', 'Đoàn Võ Văn Tịnh', 'male', '4.5', 13, 'PC13', 'Máy-13', '667379bca0f88054c204036a7768cfc77b34e832df50e4fa1f431b623f1a8d14', 'active'),
  ('HS45-14', 'Nguyễn Ngọc Bảo Trâm', 'female', '4.5', 14, 'PC14', 'Máy-14', 'eea75f2174d3db3da5c69d099d816daaab5370677223ab04110df25729b1715e', 'active'),
  ('HS45-15', 'Nguyễn Mai Trinh', 'male', '4.5', 15, 'PC15', 'Máy-15', '4561fa881f2f1ea56ed1a1df19eaa97a0ad1c3d3cd9386f65dd2cfa6adf5b45d', 'active'),
  ('HS45-16', 'Trần Thị Minh Tuyết', 'female', '4.5', 16, 'PC16', 'Máy-16', '2b5e34567b7d1f44fb7f4ee9d2da075bf109e2fd80f6a259ed0767105daf6c92', 'active'),
  ('HS45-17', 'Trần Thị Nhã Uyên', 'female', '4.5', 17, 'PC17', 'Máy-17', '7a52f83f2aaf063183fefef386ef01e7a5685d2ca008f44c0ff8a8d6ff1eebd1', 'active'),
  ('HS45-18', 'Thái Phương Yên', 'female', '4.5', 18, 'PC18', 'Máy-18', '8e397cf9efbda7fc62857b5ffcfd919342ffdb0625832890e939220373aa8e5d', 'active'),
  ('HS55-01', 'Trần Vân Anh', 'male', '5.5', 1, 'PC01', 'Máy-01', '839f28d525b59628751f9a8b11109feeb8ef17647acd5c49aa5f37001154a9fe', 'active'),
  ('HS55-02', 'Nguyễn Ngọc Bảo Ân', 'female', '5.5', 2, 'PC02', 'Máy-02', '5bcfb6981b2e43aea65b2db18724476ae7a6eebbb08cb98e47f3009f846e58bd', 'active'),
  ('HS55-03', 'Võ Hoàng Ân', 'male', '5.5', 3, 'PC03', 'Máy-03', 'cafa7f6bdea78ae2cc13887f37106b37a80c83b2293f958e4077fd400b84f52f', 'active'),
  ('HS55-04', 'Dương Quang Thiên Bảo', 'male', '5.5', 4, 'PC04', 'Máy-04', 'a605b8886626620781f99c259e157d3187992d6433f558366f86428ef8e6490d', 'active'),
  ('HS55-05', 'Trương Văn Cường', 'male', '5.5', 5, 'PC05', 'Máy-05', 'dcb2a05f52e5995be60f609711cf3481d6f58bef6e5ea618da970af46f06e5b5', 'active'),
  ('HS55-06', 'Phạm Huỳnh Băng Di', 'male', '5.5', 6, 'PC06', 'Máy-06', '055eb1460f216b483b99c21810229fc82eefbe698e0c5a3fad041e41195a0530', 'active'),
  ('HS55-07', 'Nguyễn Hương Giang', 'female', '5.5', 7, 'PC07', 'Máy-07', 'd57cd0636d11d126505d194b748ede0ccbb6a1d2263a712659d9552aace3b3f2', 'active'),
  ('HS55-08', 'Nguyễn Thị Phương Giang', 'female', '5.5', 8, 'PC08', 'Máy-08', 'f8c88b6b47585cc552958e0f00abac2c9b7c9aa274a068a000eaa84819878b76', 'active'),
  ('HS55-09', 'Nguyễn Vũ Nhật Hạ', 'male', '5.5', 9, 'PC09', 'Máy-09', '4f2b0dc40b5c52e9646683505efcf2db0a06646d838c145818234f14eceaf15a', 'active'),
  ('HS55-10', 'Nguyễn Thị Gia Hân', 'female', '5.5', 10, 'PC10', 'Máy-10', '93a0513a8764614e6f9724aa360ab5c348aac5f40848433a9438dfaae6d515c2', 'active'),
  ('HS55-11', 'Thái Gia Hân', 'female', '5.5', 11, 'PC11', 'Máy-11', 'cef7ff68d857cdca029de8710894d52ca053d742e80221d74682fb49df50ee6b', 'active'),
  ('HS55-12', 'Nguyễn Thị Thúy Hậu', 'female', '5.5', 12, 'PC12', 'Máy-12', '76c66c63b143bd2a25ab4df63ccaf532dcfa9f7c141fcd0a39cddd0de4851e82', 'active'),
  ('HS55-13', 'Trần Văn Hiếu', 'male', '5.5', 13, 'PC13', 'Máy-13', 'e5c011487bf6bcbfd56bddb4ae64626a6d00c0bd2969145e87771a621a876581', 'active'),
  ('HS55-14', 'Lê Khánh Huyền', 'female', '5.5', 14, 'PC14', 'Máy-14', 'a228f2a6f41d198cccc8ee77ffb5c58598ec03b6c2316eed04b596a65a795a96', 'active'),
  ('HS55-15', 'Võ Thị Ánh Minh', 'female', '5.5', 15, 'PC15', 'Máy-15', 'f07ce454352390d6620b882c53ad79ae16b514d366e1abf6b33dbcf3e45307ef', 'active'),
  ('HS55-16', 'Dương Nhật Nam', 'male', '5.5', 16, 'PC16', 'Máy-16', 'bf384dfaec6ea0b6daa584347c4ccf06a9ebe2b604a40473f0c4ceecb02234a5', 'active'),
  ('HS55-17', 'Đỗ Thị Mỹ Nhân', 'female', '5.5', 17, 'PC17', 'Máy-17', '06c12045230b888da7136a346bf6c3645b2124ffa5c1db839e2a55b349bdcb8f', 'active'),
  ('HS55-18', 'Đặng Thị Yến Nhi', 'female', '5.5', 18, 'PC18', 'Máy-18', '42182d0d15c03d29b538a333fbe632dccc09a78631a472fdf1a7df417d8fe892', 'active'),
  ('HS55-19', 'Trương Diệp Nhi', 'female', '5.5', 19, 'PC19', 'Máy-19', 'eccccc2ba904eee4d9348afc7daad93fcb0b4a8fc50bd3d3e330d7bbc77260d5', 'active'),
  ('HS55-20', 'Võ Quỳnh Như', 'female', '5.5', 20, 'PC20', 'Máy-20', 'e1c07f3ba25297feca9d15965924c6413b7181e3aabf5c08d8c572209bc27c66', 'active'),
  ('HS55-21', 'Nguyễn Xuân Phúc', 'male', '5.5', 21, 'PC01', 'Máy-01', '426ac8bff44f8c3a33f8e9637e329d58f014c44e8597f6a2d192adab2519cc2d', 'active'),
  ('HS55-22', 'Trần Văn Phúc', 'male', '5.5', 22, 'PC02', 'Máy-02', '2ed7eccda999c74fa7d8a9907732d0ac0b9f01e60c351ca802bc8d747edbb1db', 'active'),
  ('HS55-23', 'Trịnh Minh Phúc', 'male', '5.5', 23, 'PC03', 'Máy-03', 'f1367bbca9af2c3140282533962083e37f95409dd0172a114cae842430d33c40', 'active'),
  ('HS55-24', 'Trương Thiên Phúc', 'male', '5.5', 24, 'PC04', 'Máy-04', '630278f9d120f2f91ca2ad2a8abf5d1c6495f19f960ed71a1b3a58cd4cab0d5f', 'active'),
  ('HS55-25', 'Trần Trung Tá', 'male', '5.5', 25, 'PC05', 'Máy-05', '9ef7344fae01000b564559e7cab962e2a59ae42c9720eb18b52b7ba3745a43ab', 'active'),
  ('HS55-26', 'Lê Viết Thảo', 'female', '5.5', 26, 'PC06', 'Máy-06', '79341c3cbb21dc49fede55b5944eee869514a3cbd03c7c6811844a8ad2a118d8', 'active'),
  ('HS55-27', 'Nguyễn Quang Thịnh', 'male', '5.5', 27, 'PC07', 'Máy-07', '23962ac5b82eeb8f3b6ebad1b5bb40934c02887a4a52961fe5549e86cb9e5771', 'active'),
  ('HS55-28', 'Lê Phương Thư', 'female', '5.5', 28, 'PC08', 'Máy-08', 'be3394e0dfd461da33aec09689fca6007e8274af59d933a1e68ae067566da79b', 'active'),
  ('HS55-29', 'Trương Thị Anh Thư', 'female', '5.5', 29, 'PC09', 'Máy-09', '38826e52827d21d8525f4f9dd93882fbb1bcaebccf6e1fecb90f97b3bc728d67', 'active'),
  ('HS55-30', 'Phạm Thị Hoài Thương', 'female', '5.5', 30, 'PC10', 'Máy-10', '8cf2a36cc2c392e77be5ecd8d42e280c47901edff6458132b17c60d5e2ffcd83', 'active'),
  ('HS55-31', 'Bùi Trương Bảo Trân', 'female', '5.5', 31, 'PC11', 'Máy-11', 'a347bb188cd0acdf4f41e008f0c7f2265b0ed329de8bf0e0cde8cbefdbf78c69', 'active'),
  ('HS55-32', 'Nguyễn Quang Trí', 'male', '5.5', 32, 'PC12', 'Máy-12', '20ddae86e2b98c2ade7943d7944c229a4673c6f9064ebea843e6e62204ba624f', 'active'),
  ('HS55-33', 'Trương Quang Tuấn', 'male', '5.5', 33, 'PC13', 'Máy-13', '7a451274a41c019ab6718603bbc5995dae8eae80d7c98fd44b5c22cdb19515df', 'active'),
  ('HS55-34', 'Lê Tuấn Bình', 'male', '5.5', 34, 'PC14', 'Máy-14', '311f09f9e5cb95ae57adeb9e6fbf5c55be3e22bba36b3226af1341dfa1f34831', 'active'),
  ('HS56-01', 'Trương Thị Bảo An', 'female', '5.6', 1, 'PC01', 'Máy-01', '8b137ff5e9c8c5cb266026d2e0868140ee3e343397a753dc92634b4374346c20', 'active'),
  ('HS56-02', 'Đặng Tấn Bảo', 'male', '5.6', 2, 'PC02', 'Máy-02', '9d95e994d3a67c97cdd5ebf842f344d220113c66399f8cce314c027e775a44e4', 'active'),
  ('HS56-03', 'Bùi Trịnh Hoàng Diễm', 'male', '5.6', 3, 'PC03', 'Máy-03', '031ba0d80459922c54c0d1c37f3f69b0dcd4101c342b12e01995ac6f8e3fdb1e', 'active'),
  ('HS56-04', 'Nguyễn Thanh Hoàng Dung', 'female', '5.6', 4, 'PC04', 'Máy-04', '313dac89c51091d16095de2d83cecffe46640a1b48dfabf262edb9ef41c4e306', 'active'),
  ('HS56-05', 'Nguyễn Phan Minh Đạt', 'male', '5.6', 5, 'PC05', 'Máy-05', '4578eba5c7b8671a945999134c1678687918e1b18ccc8028fe53fb584231fd1b', 'active'),
  ('HS56-06', 'Trần Huỳnh Nhã Hân', 'female', '5.6', 6, 'PC06', 'Máy-06', '8db0b3d7da37ab20e4679afb3363210460e86eabb41a5a248340249f77ac2b4b', 'active'),
  ('HS56-07', 'Nguyễn Văn Hậu', 'male', '5.6', 7, 'PC07', 'Máy-07', 'd2737b30e3343e37e4f978c073c265e1e71eea05c79d693e6b6aa57cf2e560d8', 'active'),
  ('HS56-08', 'Nguyễn Ngọc Hiếu', 'male', '5.6', 8, 'PC08', 'Máy-08', '35ab76c0d1b7e24a4964f15d7359d79e180507f19103d354f2a2d4e5238426f6', 'active'),
  ('HS56-09', 'Bùi Tấn Anh Khoa', 'male', '5.6', 9, 'PC09', 'Máy-09', 'db3f455ab6e593df17043598562f54acbc2ba41181632f31d7e200ce050dc81c', 'active'),
  ('HS56-10', 'Nguyễn Hoàng Thùy Linh', 'female', '5.6', 10, 'PC10', 'Máy-10', 'b6d590ea9637b42e21d346acc70321433a37181213bacc9198c1fa62b982cb6d', 'active'),
  ('HS56-11', 'Nguyễn Văn Long', 'male', '5.6', 11, 'PC11', 'Máy-11', '0eb8f147f10266098df536825363fe7dff896c64e89520b2ef224e6c260156dc', 'active'),
  ('HS56-12', 'Hàng Thị Trúc Ly', 'female', '5.6', 12, 'PC12', 'Máy-12', '5b5c697796f1ed8ea048dfff3656cc522fc269e65f9170316802dbcfe3e6feff', 'active'),
  ('HS56-13', 'Thái Thiên Ngọc', 'female', '5.6', 13, 'PC13', 'Máy-13', '584fe3faf57c51c09c39b3f25523668513bb51c0cddb04c6f53bcaea480e4623', 'active'),
  ('HS56-14', 'Trương Thị Yến Nhung', 'female', '5.6', 14, 'PC14', 'Máy-14', 'c1752438233f95d960f88b850c4dd5a9e26d7e2abb93ade60e2cbe493693e11e', 'active'),
  ('HS56-15', 'Huỳnh Lê Phương', 'female', '5.6', 15, 'PC15', 'Máy-15', '3bef68046e189da42f6f410fb7c35e375cbadbb9111562671b88bf55d878b639', 'active'),
  ('HS56-16', 'Nguyễn Bùi Tiểu Quyên', 'female', '5.6', 16, 'PC16', 'Máy-16', '939dff3a13fb71e19e61a22a655ee3871b673da2f5abf0489650acaf54868b65', 'active'),
  ('HS56-17', 'Lê Dương Sơn', 'male', '5.6', 17, 'PC17', 'Máy-17', '7f9a4a0b82f77604023773e59e660647346df076fb5b1facfa8df988c0475483', 'active'),
  ('HS56-18', 'Hồ Xuân Kiều Thơ', 'female', '5.6', 18, 'PC18', 'Máy-18', '5d53c399419e2f0dc37439b12b9729e694cad34ce8f164fc253c44b95c7f90f1', 'active'),
  ('HS56-19', 'Lê Nguyễn An Trường', 'male', '5.6', 19, 'PC19', 'Máy-19', 'c3080915a24ba4107938800a0ec8630aac26a9243328e536e4d7adb253e7c1d5', 'active'),
  ('HS34-01', 'Võ Nguyễn Khánh An', 'female', '3.4', 1, 'PC01', 'Máy-01', '26d6ddbae27c0c4e87e0014b66d2eafdca6289d4d096613f72b611b75b99f54d', 'active'),
  ('HS34-02', 'Trương Nguyễn Minh Anh', 'male', '3.4', 2, 'PC02', 'Máy-02', '604133915f8d9f20c8869102ac9d31f16f05b3a7293cb082d7c03b69ea104524', 'active'),
  ('HS34-03', 'Hồ Gia Bảo', 'male', '3.4', 3, 'PC03', 'Máy-03', '14d326378020013dd2324fee38c2a39b58a4c2ff242cb65e94ea08ba5ca1ffac', 'active'),
  ('HS34-04', 'Trần Hữu Đạt', 'male', '3.4', 4, 'PC04', 'Máy-04', 'e2ff1219d7a3612aba9890ebaffe0ab94e4f7193bc438357ce1d31a144b06e44', 'active'),
  ('HS34-05', 'Nguyễn Trường Hải Đăng', 'male', '3.4', 5, 'PC05', 'Máy-05', '866978632e2352e9050b823cfa8c216334a6079bbf446f3e917738b838b962b9', 'active'),
  ('HS34-06', 'Lê Đỗ Gia Hân', 'female', '3.4', 6, 'PC06', 'Máy-06', '4207b1cb8e8aefbe441502229650f2f68cf6f77dff6ccbc5c715a7e3cb512f04', 'active'),
  ('HS34-07', 'Võ Khả Hân', 'female', '3.4', 7, 'PC07', 'Máy-07', '5c48a25bca1ad5cd02e65416c091538ea75984d9ba74be29024fcc0575a2752e', 'active'),
  ('HS34-08', 'Võ Khánh Huyền', 'female', '3.4', 8, 'PC08', 'Máy-08', '1348ca5f0b1e9dc050fbccc734ffe844550072aa9bee89ead41aa88ff3e30efc', 'active'),
  ('HS34-09', 'Bùi Bảo Gia Khiêm', 'male', '3.4', 9, 'PC09', 'Máy-09', '75f7a1fb6c58391b318bcdff841a0a738a4d8e270b46b93b17d3b630775913a4', 'active'),
  ('HS34-10', 'Nguyễn Minh Khôi', 'male', '3.4', 10, 'PC10', 'Máy-10', '50d282f7df3551ab722659aab83dd216cb28e74fdb72b970a1d61964968c05f1', 'active'),
  ('HS34-11', 'Trương Đăng Khôi', 'male', '3.4', 11, 'PC11', 'Máy-11', '21870b4beb61389fe010ee849a20f200312b6c437ee73c7b9968ea10df0550ab', 'active'),
  ('HS34-12', 'Lê Ngọc Tường Lam', 'female', '3.4', 12, 'PC12', 'Máy-12', '722a4abd609dbb5136a9815397ceb4791ae5cfa0a08d60b5f09933d05327b176', 'active'),
  ('HS34-13', 'Trương Văn Lâm', 'male', '3.4', 13, 'PC13', 'Máy-13', '0e1732c46e3f9b915ff7b45e6cb70f29729f6f9e4a74cea51e98d6fd6532553f', 'active'),
  ('HS34-14', 'Nguyễn Mỹ Lệ', 'female', '3.4', 14, 'PC14', 'Máy-14', '794ad08813368b4945a0d1c9f22ce9d70a1d790241cd85da039ca66898c80e39', 'active'),
  ('HS34-15', 'Bùi Vương Lên', 'male', '3.4', 15, 'PC15', 'Máy-15', 'fd992f9a0d5a9227f429be23a6e1ec0f831cd9078fae24c62b9dbba971554a4a', 'active'),
  ('HS34-16', 'Trương Thị Mỹ Linh', 'female', '3.4', 16, 'PC16', 'Máy-16', 'eb404642fc6f669de520be625b9ee6dddb2f32a5514b18c8ef1c217c5f2df697', 'active'),
  ('HS34-17', 'Lê Trần Sương Mây', 'male', '3.4', 17, 'PC17', 'Máy-17', '12234f2b68b2053903904218b9447a5947b0308836e7a5a5b6ff20fe53faeebe', 'active'),
  ('HS34-18', 'Lê Khánh Nam', 'male', '3.4', 18, 'PC18', 'Máy-18', 'b397e60cf67d28a7339307851a40c9ff63a24b31d49ec95b47cbb8e363e40fcf', 'active'),
  ('HS34-19', 'Đặng Thị Kim Ngân', 'female', '3.4', 19, 'PC19', 'Máy-19', '5b7ed3687b24503db6ebd7ecd2b3c92856c9de6b694a238bc927f2729af193d7', 'active'),
  ('HS34-20', 'Nguyễn Phan Thành Nhân', 'male', '3.4', 20, 'PC20', 'Máy-20', 'cf0c1e6c66b3a66df7003f3d3424b9821e8968facb2e47e4920ca05878d0a932', 'active'),
  ('HS34-21', 'Huỳnh Lê Hoài Nhiên', 'male', '3.4', 21, 'PC01', 'Máy-01', '26d6ddbae27c0c4e87e0014b66d2eafdca6289d4d096613f72b611b75b99f54d', 'active'),
  ('HS34-22', 'Đặng Võ Thị Phi Nhung', 'female', '3.4', 22, 'PC02', 'Máy-02', '604133915f8d9f20c8869102ac9d31f16f05b3a7293cb082d7c03b69ea104524', 'active'),
  ('HS34-23', 'Nguyễn Tấn Thiên Phúc', 'male', '3.4', 23, 'PC03', 'Máy-03', '14d326378020013dd2324fee38c2a39b58a4c2ff242cb65e94ea08ba5ca1ffac', 'active'),
  ('HS34-24', 'Lê Thanh Thanh', 'male', '3.4', 24, 'PC04', 'Máy-04', 'e2ff1219d7a3612aba9890ebaffe0ab94e4f7193bc438357ce1d31a144b06e44', 'active'),
  ('HS34-25', 'Trần Phương Thảo', 'female', '3.4', 25, 'PC05', 'Máy-05', '866978632e2352e9050b823cfa8c216334a6079bbf446f3e917738b838b962b9', 'active'),
  ('HS34-26', 'Nguyễn Hữu Thắng', 'male', '3.4', 26, 'PC06', 'Máy-06', '4207b1cb8e8aefbe441502229650f2f68cf6f77dff6ccbc5c715a7e3cb512f04', 'active'),
  ('HS34-27', 'Nguyễn Anh Thư', 'female', '3.4', 27, 'PC07', 'Máy-07', '5c48a25bca1ad5cd02e65416c091538ea75984d9ba74be29024fcc0575a2752e', 'active'),
  ('HS34-28', 'Đỗ Phương Trang', 'female', '3.4', 28, 'PC08', 'Máy-08', '1348ca5f0b1e9dc050fbccc734ffe844550072aa9bee89ead41aa88ff3e30efc', 'active'),
  ('HS34-29', 'Lại Thị Huyền Trang', 'female', '3.4', 29, 'PC09', 'Máy-09', '75f7a1fb6c58391b318bcdff841a0a738a4d8e270b46b93b17d3b630775913a4', 'active'),
  ('HS34-30', 'Trương Văn Xuân Trường', 'male', '3.4', 30, 'PC10', 'Máy-10', '50d282f7df3551ab722659aab83dd216cb28e74fdb72b970a1d61964968c05f1', 'active'),
  ('HS34-31', 'Bùi Anh Tú', 'male', '3.4', 31, 'PC11', 'Máy-11', '21870b4beb61389fe010ee849a20f200312b6c437ee73c7b9968ea10df0550ab', 'active'),
  ('HS35-01', 'Nguyễn Lê Thiên Ái', 'male', '3.5', 1, 'PC01', 'Máy-01', 'aacec27a5af2e4f4e6f4cff2f1dd3dcd9528896021fa36807e2b020087c73bd2', 'active'),
  ('HS35-02', 'Bùi Quỳnh Anh', 'female', '3.5', 2, 'PC02', 'Máy-02', 'ff8a002420ea875d192dc35e65e5a408292b499f4d54115d14b2402fb013a420', 'active'),
  ('HS35-03', 'Hà Tú Anh', 'male', '3.5', 3, 'PC03', 'Máy-03', '58b6c5a8a9554d314c71fe3d96ab8ae92c2c6c0320bd5ce3ec5a51d8ef0aca33', 'active'),
  ('HS35-04', 'Nguyễn Hoàng Duy Anh', 'male', '3.5', 4, 'PC04', 'Máy-04', '508d864624ac3764c1634d229b5807e834e7f8022a28872d989bc2daefb3d9d7', 'active'),
  ('HS35-05', 'Nguyễn Lại Thanh Bình', 'male', '3.5', 5, 'PC05', 'Máy-05', '970bd14fc0d02a47a63537a23e6007c9b3b8f10f2c289c0d4efb625d1b8037bf', 'active'),
  ('HS35-06', 'Nguyễn Phương Chi', 'female', '3.5', 6, 'PC06', 'Máy-06', '4ed5f9d46a5232fe1013c0e6328bb6d0789a72a62949a83cd433a3904486d5a2', 'active'),
  ('HS35-07', 'Phạm Thiên Di', 'male', '3.5', 7, 'PC07', 'Máy-07', '981dc89215ef57b230974097807a07a6f1d750f59660abef62b0f23c51c8b9fb', 'active'),
  ('HS35-08', 'Trần Đình Dũng', 'male', '3.5', 8, 'PC08', 'Máy-08', '4d33263b19926f501f076eba4e9a692a64934a251eba1fff2a3822438583fcb0', 'active'),
  ('HS35-09', 'Trương Quốc Đạt', 'male', '3.5', 9, 'PC09', 'Máy-09', '86af74c11bc0b3f98db7ec8c52e6eadc80492796a8d2d659c1891fe263b16cb7', 'active'),
  ('HS35-10', 'Trần Thị Gia Hân', 'female', '3.5', 10, 'PC10', 'Máy-10', '30a6dd033a888e39bcbfe4e2097472666952fa86fde7e3f4b4a73ce8e521fe57', 'active'),
  ('HS35-11', 'Trương Văn Huy', 'male', '3.5', 11, 'PC11', 'Máy-11', '6b68a147757afd26527929569bba42e29125d6313ec1145d555defb40fb6e251', 'active'),
  ('HS35-12', 'Ung Gia Khang', 'male', '3.5', 12, 'PC12', 'Máy-12', '7f797bd6a5df5ad1dd400fa967a4fa7d7e393f201e4b15e3d0887a5670181946', 'active'),
  ('HS35-13', 'Nguyễn Quang Khánh', 'male', '3.5', 13, 'PC13', 'Máy-13', '227f9ab40970d709c132597242c323a89c4ec693cef5926afeaa314c3f962baf', 'active'),
  ('HS35-14', 'Nguyễn Văn Khánh', 'male', '3.5', 14, 'PC14', 'Máy-14', '2e3096e25046e71faaa0d971028bbeeca7f93381bbcca6ceb68f5ddc4b1708bc', 'active'),
  ('HS35-15', 'Nguyễn Gia Khiêm', 'male', '3.5', 15, 'PC15', 'Máy-15', '3947f289004c23b82d71c93663378983dec1d9c6dc23a7dfcad103dc3e0f11b1', 'active'),
  ('HS35-16', 'Ôn Nguyễn Đăng Khoa', 'male', '3.5', 16, 'PC16', 'Máy-16', '92f30c4f8fad4340423a8749a84f7dfa79e9b20c1b57a742a0fa0aa10b608180', 'active'),
  ('HS35-17', 'Trương Lê Anh Khoa', 'male', '3.5', 17, 'PC17', 'Máy-17', '24ca0fbbc26a689def04ede55ae37aa8129b66fd8a472706cba56482a243c610', 'active'),
  ('HS35-18', 'Nguyễn Minh Tuấn Kiệt', 'male', '3.5', 18, 'PC18', 'Máy-18', '216b35d8bd343362eb9017b2f1c5b852a150a5335ecb50d47b4ab6ccdfb343aa', 'active'),
  ('HS35-19', 'Trương Thị Kiều Linh', 'female', '3.5', 19, 'PC19', 'Máy-19', 'e45286731d52f4152d3c98ab320bb6406911c2b2ef3332cf163ad6ece8b3ec72', 'active'),
  ('HS35-20', 'Bùi Bảo Long', 'male', '3.5', 20, 'PC20', 'Máy-20', '9bef236c9d89749d7a698d38aae4e974003ca34317d8d0e3e3421ab7d22b089b', 'active'),
  ('HS35-21', 'Trà Thị Lợi', 'female', '3.5', 21, 'PC01', 'Máy-01', 'aacec27a5af2e4f4e6f4cff2f1dd3dcd9528896021fa36807e2b020087c73bd2', 'active'),
  ('HS35-22', 'Võ Quang Minh', 'male', '3.5', 22, 'PC02', 'Máy-02', 'ff8a002420ea875d192dc35e65e5a408292b499f4d54115d14b2402fb013a420', 'active'),
  ('HS35-23', 'Nguyễn Đức Thiên Ngân', 'male', '3.5', 23, 'PC03', 'Máy-03', '58b6c5a8a9554d314c71fe3d96ab8ae92c2c6c0320bd5ce3ec5a51d8ef0aca33', 'active'),
  ('HS35-24', 'Nguyễn Ngọc Nhi', 'female', '3.5', 24, 'PC04', 'Máy-04', '508d864624ac3764c1634d229b5807e834e7f8022a28872d989bc2daefb3d9d7', 'active'),
  ('HS35-25', 'Trương Thị Quỳnh Nhi', 'female', '3.5', 25, 'PC05', 'Máy-05', '970bd14fc0d02a47a63537a23e6007c9b3b8f10f2c289c0d4efb625d1b8037bf', 'active'),
  ('HS35-26', 'Nguyễn Quỳnh Như', 'female', '3.5', 26, 'PC06', 'Máy-06', '4ed5f9d46a5232fe1013c0e6328bb6d0789a72a62949a83cd433a3904486d5a2', 'active'),
  ('HS35-27', 'Trương Văn Định Thiên', 'male', '3.5', 27, 'PC07', 'Máy-07', '981dc89215ef57b230974097807a07a6f1d750f59660abef62b0f23c51c8b9fb', 'active'),
  ('HS35-28', 'Lê Ngọc Anh Thư', 'female', '3.5', 28, 'PC08', 'Máy-08', '4d33263b19926f501f076eba4e9a692a64934a251eba1fff2a3822438583fcb0', 'active'),
  ('HS35-29', 'Lê Anh Triều', 'male', '3.5', 29, 'PC09', 'Máy-09', '86af74c11bc0b3f98db7ec8c52e6eadc80492796a8d2d659c1891fe263b16cb7', 'active'),
  ('HS35-30', 'Lê Phan Anh Tuấn', 'male', '3.5', 30, 'PC10', 'Máy-10', '30a6dd033a888e39bcbfe4e2097472666952fa86fde7e3f4b4a73ce8e521fe57', 'active'),
  ('HS35-31', 'Võ Thị Tường Vy', 'female', '3.5', 31, 'PC11', 'Máy-11', '6b68a147757afd26527929569bba42e29125d6313ec1145d555defb40fb6e251', 'active'),
  ('HS36-01', 'Trần Ngọc Linh Đan', 'female', '3.6', 1, 'PC01', 'Máy-01', '7d61cd534d2b8d50d6015f19394d4c16484f45345482f10617db10a44f1633c3', 'active'),
  ('HS36-02', 'Nguyễn Gia Huy', 'male', '3.6', 2, 'PC02', 'Máy-02', 'e394c954c2ce38f6c15831729b1ce72bbb61dca23f7f96e8bc7f5add92196dc9', 'active'),
  ('HS36-03', 'Phạm Văn Hưng', 'male', '3.6', 3, 'PC03', 'Máy-03', '6463286c282dddbd8f61eda1e68fc9bfd40207f2529e51eb276fae66825aec64', 'active'),
  ('HS36-04', 'Trần Trung Gia Hưng', 'male', '3.6', 4, 'PC04', 'Máy-04', '65084ea994aa1631b4eeba6c8840b14910283f36e7dfa5387bf0ba2d1e7d751b', 'active'),
  ('HS36-05', 'Hồ Hy', 'male', '3.6', 5, 'PC05', 'Máy-05', '05ee5e6455b1328241b0703fa82e0d1b6785883d268e6a8ef5b023ecadb98eb4', 'active'),
  ('HS36-06', 'Lê Nguyễn Minh Khang', 'male', '3.6', 6, 'PC06', 'Máy-06', '93937aa4136fd6709366914dc732d7338db1f8da78e3c3b3d6ad7287762114d2', 'active'),
  ('HS36-07', 'Võ Đặng Anh Khoa', 'male', '3.6', 7, 'PC07', 'Máy-07', 'cd58de9e4bc017c6a70ea8117ac9c67c7e7bac2fa843714ed046b9d214e2e6df', 'active'),
  ('HS36-08', 'Nguyễn Văn Thành Khôi', 'male', '3.6', 8, 'PC08', 'Máy-08', 'b0346c08aaaffe7e1a3f92c99e01433ce848a34293b912052f94573920fe4f86', 'active'),
  ('HS36-09', 'Hàng Thị Trúc Linh', 'female', '3.6', 9, 'PC09', 'Máy-09', '4635a2861429ec7a708a6d938c4fecbd7d3b1f013204321c011f964891949f2d', 'active'),
  ('HS36-10', 'Lê Duy Mạnh', 'male', '3.6', 10, 'PC10', 'Máy-10', '88524b6d4c59e8bcf6072f2075373f45b3230b1f2a07949c360b44017c8d6b14', 'active'),
  ('HS36-11', 'Nguyễn Văn Hoài Nam', 'male', '3.6', 11, 'PC11', 'Máy-11', 'fd21a456e3cfb7d269619b67d66dab779863449f3e781856d1e735739597e8ed', 'active'),
  ('HS36-12', 'Dương Bảo Ngân', 'female', '3.6', 12, 'PC12', 'Máy-12', '2095a4f165289dca1eeff6ce97bf3398018427c0fc79fc5b263043a8a66f4c9b', 'active'),
  ('HS36-13', 'Phùng Thị Khánh Ngân', 'female', '3.6', 13, 'PC13', 'Máy-13', 'cb8cb782aee954305b5f49c128539037713422545c2cde403498fba8b9a81231', 'active'),
  ('HS36-14', 'Huỳnh Thiện Nhân', 'male', '3.6', 14, 'PC14', 'Máy-14', '8b800f2f00f1b21075cfb4573f4391060c006fe57cb8f1939151fcdcc03338ef', 'active'),
  ('HS36-15', 'Bùi Tấn Anh Nhật', 'male', '3.6', 15, 'PC15', 'Máy-15', '86c7cdecb3d0dd86b2bb185840ccbf07b5f85885044be0c73b3fa43f5dd4c8e4', 'active'),
  ('HS36-16', 'Bùi Thái Quỳnh Như', 'female', '3.6', 16, 'PC16', 'Máy-16', '7b945aab134ce65e6c00d68aba4b66aa4a975a3792880eeb243d98f419e3c728', 'active'),
  ('HS36-17', 'Lê Khắc Trung Quân', 'male', '3.6', 17, 'PC17', 'Máy-17', '786a25dee9a17fd63a3c312f50b0f733aa7ecf7709ebb223244ab09d7c766450', 'active'),
  ('HS36-18', 'Đặng Quang Sang', 'male', '3.6', 18, 'PC18', 'Máy-18', '43290b2abe5fee5248eaca1fa1244645e64679064c44b0053118c7ae4c117724', 'active'),
  ('HS36-19', 'Bùi Quốc Thiên', 'male', '3.6', 19, 'PC19', 'Máy-19', 'b8e5e3b920abf9cbfbb99af058e26af6a7847dbb5eab56dc114c8a80bd644b35', 'active'),
  ('HS36-20', 'Nguyễn Tấn Thiện', 'male', '3.6', 20, 'PC20', 'Máy-20', 'f638745afed6f744be89c5e5e7af0088f9a1f0ff172528c2fafa7aae1d93365a', 'active'),
  ('HS36-21', 'Đặng Tấn Trung', 'male', '3.6', 21, 'PC01', 'Máy-01', '7d61cd534d2b8d50d6015f19394d4c16484f45345482f10617db10a44f1633c3', 'active'),
  ('HS36-22', 'Lê Thị Nhã Uyên', 'female', '3.6', 22, 'PC02', 'Máy-02', 'e394c954c2ce38f6c15831729b1ce72bbb61dca23f7f96e8bc7f5add92196dc9', 'active'),
  ('HS36-23', 'Trần Tú Uyên', 'female', '3.6', 23, 'PC03', 'Máy-03', '6463286c282dddbd8f61eda1e68fc9bfd40207f2529e51eb276fae66825aec64', 'active'),
  ('HS54-01', 'Trần Khánh An', 'female', '5.4', 1, 'PC01', 'Máy-01', 'd6c67739e7bc253267955bea7d2d2e35ad1df44f2f047b207c871d2278904a61', 'active'),
  ('HS54-02', 'Cao Thanh Bình', 'male', '5.4', 2, 'PC02', 'Máy-02', 'e8eeb6e9450166bba3b2b6596a080400432c2c404f6fb115059724370f4d84dd', 'active'),
  ('HS54-03', 'Trịnh Trần Phương Chi', 'female', '5.4', 3, 'PC03', 'Máy-03', 'a45f8bf8ce07f241e53bb6f179b5cdf6f18b7e96b42ebb1488f9fb895d4990fd', 'active'),
  ('HS54-04', 'Phan Bảo Duy', 'male', '5.4', 4, 'PC04', 'Máy-04', '243f86e603d492ba5416341d67f847992016a7222c3b7eb92516ba0b1a9e36b8', 'active'),
  ('HS54-05', 'Nguyễn Thị Mỹ Hạnh', 'female', '5.4', 5, 'PC05', 'Máy-05', '524e34fbe09363c79f5eefc91895eed94ffb4d4b2b8b7ab411673068657962fe', 'active'),
  ('HS54-06', 'Huỳnh Duy Trung Hiếu', 'male', '5.4', 6, 'PC06', 'Máy-06', '101431bf9a1d4567ffc78a999e8db213b6cc598d6a210c42b8fa8102e740d4a7', 'active'),
  ('HS54-07', 'Phạm Đoàn Gia Huy', 'male', '5.4', 7, 'PC07', 'Máy-07', 'aa5a54374b0206fbb40d2967a7f25b17d2c3aef80e9e54be573c17e7412f3a2f', 'active'),
  ('HS54-08', 'Trần Bảo Huy', 'male', '5.4', 8, 'PC08', 'Máy-08', '5e33a213a174d59fcd0e96cba50cc180da053a42b422eceeca675eed232fff19', 'active'),
  ('HS54-09', 'Lại Khánh Huyền', 'female', '5.4', 9, 'PC09', 'Máy-09', 'a63e14fe511382d9d3c6727c6568ccdc94f37b0274cb5db78720e28d8476c8c2', 'active'),
  ('HS54-10', 'Lê Viết Trọng Khanh', 'male', '5.4', 10, 'PC10', 'Máy-10', '0177416446280c50ea0c27360c934029fc8b591b81ccee7edb2ea2e00af06b0c', 'active'),
  ('HS54-11', 'Trương Anh Khoa', 'male', '5.4', 11, 'PC11', 'Máy-11', '9fbd0cbcdbe1cc685572f459a85c68f76c99041ad0b384d9f229df05f44b7e4e', 'active'),
  ('HS54-12', 'Trương Tấn Lâm', 'male', '5.4', 12, 'PC12', 'Máy-12', '7ab3a79672b37b4d82285ee81c82d8d3fad1f3c5149457a18091e36cf8b922ba', 'active'),
  ('HS54-13', 'Phan Trương Gia Linh', 'female', '5.4', 13, 'PC13', 'Máy-13', 'fe04a7f1d6e40762e3405d12f79a32bfe7168efca3c590c9495ba468bd945e42', 'active'),
  ('HS54-14', 'Lê Trịnh Khánh Ly', 'female', '5.4', 14, 'PC14', 'Máy-14', 'ebaa912998a9a905c3a167a09fc27c165b4a9a236970ef0a5dc57be302e3eb92', 'active'),
  ('HS54-15', 'Nguyễn Hoàng Minh', 'male', '5.4', 15, 'PC15', 'Máy-15', '82a42fb5924c5df94d357628676ec81cef21af051caf475c5faa68a7db122715', 'active'),
  ('HS54-16', 'Nguyễn Thị Huyền My', 'female', '5.4', 16, 'PC16', 'Máy-16', 'ecde62d5f31027a9143f8758631db1716e99d408cefa76796d931578fef435ac', 'active'),
  ('HS54-17', 'Trương Hiểu My', 'female', '5.4', 17, 'PC17', 'Máy-17', '1252db097239bc68991cdfeaf25ee74d7d3b5217517c549df8260cd74ce76af2', 'active'),
  ('HS54-18', 'Dương Huỳnh Thu Ngân', 'female', '5.4', 18, 'PC18', 'Máy-18', 'c028f073b5e33cdd732ffdf445dcbea627f6416f534a6141b4928cd22a49e5b3', 'active'),
  ('HS54-19', 'Nguyễn Vũ Uyên Nhi', 'female', '5.4', 19, 'PC19', 'Máy-19', 'c57dc1f7d1e6e45061533751744b0c27eaaf4fe9806679f3426fb0362c3cfcd6', 'active'),
  ('HS54-20', 'Trần Lưu Tiết Nhi', 'female', '5.4', 20, 'PC20', 'Máy-20', '5e77b6ebf9d8ef29dba35c5f114a28121458a341f44cfe3972a71c66bb4e23a5', 'active'),
  ('HS54-21', 'Võ Nguyễn Bảo Nhi', 'female', '5.4', 21, 'PC01', 'Máy-01', 'd6c67739e7bc253267955bea7d2d2e35ad1df44f2f047b207c871d2278904a61', 'active'),
  ('HS54-22', 'Lê Hạo Nhiên', 'male', '5.4', 22, 'PC02', 'Máy-02', 'e8eeb6e9450166bba3b2b6596a080400432c2c404f6fb115059724370f4d84dd', 'active'),
  ('HS54-23', 'Nguyễn Thảo Như', 'female', '5.4', 23, 'PC03', 'Máy-03', 'a45f8bf8ce07f241e53bb6f179b5cdf6f18b7e96b42ebb1488f9fb895d4990fd', 'active'),
  ('HS54-24', 'Lê Tấn Nhật Phát', 'male', '5.4', 24, 'PC04', 'Máy-04', '243f86e603d492ba5416341d67f847992016a7222c3b7eb92516ba0b1a9e36b8', 'active'),
  ('HS54-25', 'Nguyễn Thị Thanh Phúc', 'female', '5.4', 25, 'PC05', 'Máy-05', '524e34fbe09363c79f5eefc91895eed94ffb4d4b2b8b7ab411673068657962fe', 'active'),
  ('HS54-26', 'Nguyễn Mạnh Quân', 'male', '5.4', 26, 'PC06', 'Máy-06', '101431bf9a1d4567ffc78a999e8db213b6cc598d6a210c42b8fa8102e740d4a7', 'active'),
  ('HS54-27', 'Nguyễn Lê Ngọc Thuận', 'female', '5.4', 27, 'PC07', 'Máy-07', 'aa5a54374b0206fbb40d2967a7f25b17d2c3aef80e9e54be573c17e7412f3a2f', 'active'),
  ('HS54-28', 'Lê Thị Thu Thủy', 'female', '5.4', 28, 'PC08', 'Máy-08', '5e33a213a174d59fcd0e96cba50cc180da053a42b422eceeca675eed232fff19', 'active'),
  ('HS54-29', 'Nguyễn Hà Anh Thư', 'female', '5.4', 29, 'PC09', 'Máy-09', 'a63e14fe511382d9d3c6727c6568ccdc94f37b0274cb5db78720e28d8476c8c2', 'active'),
  ('HS54-30', 'Nguyễn Dương Bảo Thy', 'male', '5.4', 30, 'PC10', 'Máy-10', '0177416446280c50ea0c27360c934029fc8b591b81ccee7edb2ea2e00af06b0c', 'active'),
  ('HS54-31', 'Nguyễn Thị Bảo Trâm', 'female', '5.4', 31, 'PC11', 'Máy-11', '9fbd0cbcdbe1cc685572f459a85c68f76c99041ad0b384d9f229df05f44b7e4e', 'active'),
  ('HS54-32', 'Nguyễn Tấn Phi Trường', 'male', '5.4', 32, 'PC12', 'Máy-12', '7ab3a79672b37b4d82285ee81c82d8d3fad1f3c5149457a18091e36cf8b922ba', 'active'),
  ('HS54-33', 'Đặng Quốc Việt', 'male', '5.4', 33, 'PC13', 'Máy-13', 'fe04a7f1d6e40762e3405d12f79a32bfe7168efca3c590c9495ba468bd945e42', 'active'),
  ('HS34-34', 'Trương Thị Tố Uyên', 'female', '5.5', 34, 'PC14', 'Máy-14', 'f3ff0d238ea93abd4a5a0f44eb23d0cae6826413f97271617a730456889ece4a', 'active'),
  ('HS35-35', 'Trịnh Thị Như Ý', 'female', '5.4', 35, 'PC15', 'Máy-15', '82a42fb5924c5df94d357628676ec81cef21af051caf475c5faa68a7db122715', 'active')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  gender = EXCLUDED.gender,
  class_code = EXCLUDED.class_code,
  seat_number = EXCLUDED.seat_number,
  assigned_pc = EXCLUDED.assigned_pc,
  seat = EXCLUDED.seat,
  hashed_pin = EXCLUDED.hashed_pin,
  status = EXCLUDED.status;

-- BƯỚC 4: CÂU LỆNH KIỂM TRA KẾT QUẢ SAU KHI CHẠY (VERIFICATION QUERIES)
-- 1. Kiểm tra tổng số lượng học sinh trong bảng (kỳ vọng: 249 + 12 = 261 nếu giữ cả cũ, hoặc 249 nếu chỉ đếm các lớp chính thức)
SELECT COUNT(*) AS tong_so_hoc_sinh FROM public.students;

-- 2. Thống kê số lượng học sinh theo từng lớp chính thức (kỳ vọng đủ 9 lớp)
SELECT 
  COALESCE(class_code, 'Lớp mẫu cũ') AS lop,
  COUNT(*) AS so_luong_hs
FROM public.students
GROUP BY class_code
ORDER BY lop;

-- 3. Kiểm tra kiểm tra trùng lặp mã học sinh (kỳ vọng: 0 dòng)
SELECT code, COUNT(*) 
FROM public.students 
GROUP BY code 
HAVING COUNT(*) > 1;

-- 4. Kiểm tra dữ liệu máy trạm được chỉ định (PC01 - PC20)
SELECT assigned_pc, COUNT(*) AS so_hs_ngoi_may
FROM public.students
WHERE assigned_pc IS NOT NULL
GROUP BY assigned_pc
ORDER BY assigned_pc;

-- ==============================================================================
-- PHƯƠNG ÁN KHÔI PHỤC (ROLLBACK SCRIPT - NẾU CẦN HOÀN TÁC HOÀN TOÀN)
-- ==============================================================================
/*
-- Để khôi phục lại nguyên trạng 12 học sinh mẫu cũ như ban đầu:
TRUNCATE TABLE public.students;
INSERT INTO public.students SELECT * FROM public.students_backup_old;
DROP TABLE IF EXISTS public.students_backup_old;
*/
