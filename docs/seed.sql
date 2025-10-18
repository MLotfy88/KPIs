-- Seed data for evaluation_items
INSERT INTO public.evaluation_items (item_key, question, category, evaluation_types) VALUES
('uniform_commitment', 'الالتزام بالزي الرسمي', 'behavioral', '{weekly, monthly}'),
('timing_commitment', 'الالتزام بالمواعيد', 'behavioral', '{weekly, monthly}'),
('daily_documentation', 'التسجيل اليومي للبيانات', 'technical', '{weekly, monthly}'),
('task_commitment', 'الالتزام بالمهام الموكلة', 'behavioral', '{weekly, monthly}'),
('handling_skills', 'مهارة التعامل مع المرضى', 'care', '{monthly}'),
('performance_accuracy', 'دقة الأداء في المهام الطبية', 'technical', '{monthly}'),
('response_speed', 'سرعة الاستجابة للحالات الطارئة', 'technical', '{monthly}'),
('patient_evaluation', 'تقييم المرضى لسلوك الممرض', 'care', '{monthly}'),
('infection_control', 'الالتزام ببروتوكولات مكافحة العدوى', 'technical', '{monthly}'),
('team_collaboration', 'معدل التعاون مع الفريق', 'behavioral', '{monthly}');

-- Seed data for badges
INSERT INTO public.badges (badge_name, badge_icon, description, linked_metrics, criteria_type, thresholds, period_type, active, editable) VALUES
('شارة التميز', 'Award', 'تُمنح للمتميزين في الأداء العام', '{"uniform_commitment", "handling_skills", "performance_accuracy", "response_speed"}', 'average', '{"bronze": 80, "silver": 85, "gold": 90, "platinum": 95}', 'monthly', true, true),
('شارة الانضباط', 'Shield', 'تُمنح للمنضبطين في الحضور والمهام', '{"timing_commitment", "daily_documentation", "task_commitment"}', 'average', '{"bronze": 85, "silver": 90, "gold": 95, "platinum": 100}', 'monthly', true, true),
('شارة التطور والتحسن', 'TrendingUp', 'تُمنح لمن يظهر تحسنًا ملحوظًا في الأداء', '{}', 'improvement', '{"value": 10, "operator": ">="}', 'monthly', true, false),
('شارة الرعاية الإنسانية', 'Heart', 'تُمنح بناءً على تقييمات المرضى العالية', '{"patient_evaluation", "handling_skills"}', 'average', '{"bronze": 80, "silver": 85, "gold": 90, "platinum": 95}', 'monthly', true, true),
('شارة مكافحة العدوى', 'Zap', 'تُمنح للالتزام بمعايير النظافة ومكافحة العدوى', '{"infection_control"}', 'average', '{"bronze": 85, "silver": 90, "gold": 95, "platinum": 100}', 'monthly', true, true),
('شارة الفريق المثالي', 'Users', 'تُمنح للأعضاء الأكثر تعاونًا في الفريق', '{"team_collaboration"}', 'average', '{"bronze": 85, "silver": 90, "gold": 95, "platinum": 100}', 'monthly', true, true);
