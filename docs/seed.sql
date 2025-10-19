-- Seed data for evaluation_items
-- This data is derived directly from the monthly and weekly questionnaire HTML files.

-- Clear existing items to avoid duplicates
DELETE FROM public.evaluation_items;

INSERT INTO public.evaluation_items (item_key, question, category, evaluation_types) VALUES
-- Monthly Evaluation Items - المحور الأول: الأداء الفني والإجرائي
('infection_control', 'الالتزام بمكافحة العدوى', 'technical', '{monthly}'),
('patient_prep_checklist', 'تجهيز المريض طبقًا لقائمة التحقق (Checklist)', 'technical', '{monthly}'),
('cannula_insertion', 'تركيب الكانيولا وتعقيم موضع الإدخال', 'technical', '{monthly}'),
('medication_admin', 'إعطاء الأدوية التحضيرية بدقة وفي التوقيت', 'technical', '{monthly}'),
('patient_support_monitoring', 'التواجد بجانب المريض أثناء القسطرة (دعم ومراقبة)', 'technical', '{monthly}'),
('sterile_field_maintenance', 'الحفاظ على الحقل المعقم أثناء الإجراء', 'technical', '{monthly}'),
('vitals_recording', 'تسجيل العلامات الحيوية بعد الإجراء بدقة وفي المواقيت', 'technical', '{monthly}'),
('insertion_site_monitoring', 'مراقبة مكان الإدخال لأي نزيف/مضاعفات', 'technical', '{monthly}'),
('equipment_cleaning', 'نظافة وتعقيم الأسرة والأجهزة بعد كل حالة', 'technical', '{monthly}'),

-- Monthly Evaluation Items - المحور الثاني: السلوك والانضباط المهني
('attendance_punctuality', 'الالتزام بمواعيد الحضور والانصراف', 'behavioral', '{monthly}'),
('calmness_discipline', 'الهدوء والانضباط داخل الوحدة', 'behavioral', '{monthly}'),
('uniform_appearance', 'نظافة المظهر والزى الرسمي', 'behavioral', '{monthly}'),
('respect_admin_instructions', 'احترام التعليمات الإدارية', 'behavioral', '{monthly}'),
('cooperation_colleagues', 'التعاون مع الزملاء والأطباء', 'behavioral', '{monthly}'),
('phone_usage_policy', 'عدم استخدام الهاتف أثناء العمل', 'behavioral', '{monthly}'),
('patient_confidentiality', 'الحفاظ على سرية معلومات المرضى', 'behavioral', '{monthly}'),
('handling_pressure', 'تحمل المسؤولية وقت الضغط', 'behavioral', '{monthly}'),

-- Monthly Evaluation Items - المحور الثالث: رعاية المريض والتوثيق
('patient_welcoming', 'الترحيب وتهدئة المريض عند الدخول', 'care', '{monthly}'),
('procedure_explanation', 'شرح خطوات الإجراء بلغة بسيطة', 'care', '{monthly}'),
('recovery_phase_presence', 'التواجد فى مرحلة الإفاقة (المتابعة بعد القسطرة)', 'care', '{monthly}'),
('patient_request_response', 'سرعة الاستجابة لطلبات المريض', 'care', '{monthly}'),
('medication_timing_accuracy', 'إعطاء العلاج فى مواعيده بدقة', 'care', '{monthly}'),
('charting_documentation_accuracy', 'دقة الشيت والتوثيق (قياسات فعلية)', 'care', '{monthly}'),
('handover_reporting', 'تسليم الشيت ونقل الملاحظات للمشرف فى نهاية الوردية', 'care', '{monthly}'),
('doctor_communication', 'التواصل مع الطبيب حال حدوث تغيّر فى حالة المريض', 'care', '{monthly}'),

-- Monthly Evaluation Items - المحور الرابع: المبادرة والتطوير
('initiative_helping', 'المبادرة بالمساعدة دون طلب', 'development', '{monthly}'),
('improvement_suggestions', 'تقديم اقتراحات عملية لتحسين العمل', 'development', '{monthly}'),
('training_participation', 'المشاركة فى التدريب والتعليم', 'development', '{monthly}'),
('role_model_discipline', 'القدوة والانضباط العام', 'development', '{monthly}'),

-- Weekly Evaluation Items
('infection_control_weekly', 'الالتزام بمكافحة العدوى (غسل اليدين، تعقيم الأدوات)', 'technical', '{weekly}'),
('patient_prep_checklist_weekly', 'تجهيز المريض بدقة قبل القسطرة (قائمة التحقق)', 'technical', '{weekly}'),
('patient_support_monitoring_weekly', 'التواجد بجانب المريض أثناء القسطرة (دعم نفسى ومساعدة الطبيب)', 'technical', '{weekly}'),
('post_procedure_instructions_weekly', 'تنفيذ تعليمات الطبيب بعد القسطرة (دقة وسرعة)', 'technical', '{weekly}'),
('vitals_recording_weekly', 'تسجيل العلامات الحيوية بدقة وفي المواقيت المحددة', 'technical', '{weekly}'),
('attendance_punctuality_weekly', 'الالتزام بالمواعيد والانضباط (الحضور/المغادرة)', 'behavioral', '{weekly}'),
('calmness_discipline_weekly', 'الهدوء وضبط الجو داخل الوحدة (تقليل الضوضاء)', 'behavioral', '{weekly}'),
('patient_request_response_weekly', 'سرعة الاستجابة لطلبات المريض (راحة/ألم/طلب)', 'care', '{weekly}'),
('charting_documentation_accuracy_weekly', 'دقة الشيت والتوثيق (قياسات فعلية)', 'care', '{weekly}');


-- Seed data for badges (NOTE: linked_metrics might need review to match new item_keys)
INSERT INTO public.badges (badge_name, badge_icon, description, linked_metrics, criteria_type, thresholds, period_type, active, editable) VALUES
('شارة التميز', 'Award', 'تُمنح للمتميزين في الأداء العام', '{"infection_control", "patient_support_monitoring", "handling_pressure", "medication_admin"}', 'average', '{"bronze": 3.5, "silver": 4.0, "gold": 4.5, "platinum": 4.8}', 'monthly', true, true),
('شارة الانضباط', 'Shield', 'تُمنح للمنضبطين في الحضور والمهام', '{"attendance_punctuality", "respect_admin_instructions", "uniform_appearance"}', 'average', '{"bronze": 4.0, "silver": 4.5, "gold": 4.8, "platinum": 5.0}', 'monthly', true, true),
('شارة التطور والتحسن', 'TrendingUp', 'تُمنح لمن يظهر تحسنًا ملحوظًا في الأداء', '{}', 'improvement', '{"value": 10, "operator": ">="}', 'monthly', true, false),
('شارة الرعاية الإنسانية', 'Heart', 'تُمنح بناءً على تقييمات المرضى العالية', '{"patient_welcoming", "procedure_explanation", "patient_request_response"}', 'average', '{"bronze": 4.0, "silver": 4.5, "gold": 4.8, "platinum": 5.0}', 'monthly', true, true),
('شارة مكافحة العدوى', 'Zap', 'تُمنح للالتزام بمعايير النظافة ومكافحة العدوى', '{"infection_control", "sterile_field_maintenance", "equipment_cleaning"}', 'average', '{"bronze": 4.0, "silver": 4.5, "gold": 4.8, "platinum": 5.0}', 'monthly', true, true),
('شارة الفريق المثالي', 'Users', 'تُمنح للأعضاء الأكثر تعاونًا في الفريق', '{"cooperation_colleagues", "initiative_helping", "training_participation"}', 'average', '{"bronze": 4.0, "silver": 4.5, "gold": 4.8, "platinum": 5.0}', 'monthly', true, true);
