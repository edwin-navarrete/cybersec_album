-- For databases created before question sets existed.
-- Every existing question becomes part of the 'default' set.
ALTER TABLE `question`
  ADD COLUMN `question_set` varchar(50) NOT NULL DEFAULT 'default'
    COMMENT 'Named set of questions, the server plays the one in QUESTION_SET',
  ADD KEY `question_set_idx` (`question_set`);
