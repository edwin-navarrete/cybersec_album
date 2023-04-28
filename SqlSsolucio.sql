CREATE TABLE `ssolucio_cyberalbum`.`album` (
   `album_id` VARCHAR(36) NOT NULL ,
   `started_on` BIGINT NOT NULL,
   `ended_on` BIGINT,
   `language` VARCHAR(20) NOT NULL,
   `os` TINYTEXT,
   `platform` TINYTEXT,
   `browser` TINYTEXT,
   `version` TINYTEXT,
   `is_mobile` BOOLEAN,
    PRIMARY KEY (`album_id`) ) ENGINE = InnoDB;

CREATE TABLE `ssolucio_cyberalbum`.`user_answer` (
 `user_answer_id` INT NOT NULL AUTO_INCREMENT,
  `album_id` VARCHAR(36) NOT NULL ,
   `question_id` INT NOT NULL ,
   `success` BOOLEAN,
   `latency` INT,
   `attempts` INT,
   `answered_on` BIGINT NOT NULL,
    PRIMARY KEY (`user_answer_id`),
    INDEX `album_id_idx` (`album_id`) ) ENGINE = InnoDB;
    
    CREATE TABLE `ssolucio_cyberalbum`.`user_sticker` (
 `user_sticker_id` INT NOT NULL AUTO_INCREMENT,
  `album_id` VARCHAR(36) NOT NULL ,
   `sticker_id` INT NOT NULL ,
   `in_album` BOOLEAN NOT NULL DEFAULT FALSE ,
   `added_on` BIGINT NOT NULL ,
    PRIMARY KEY (`user_sticker_id`),
    INDEX `album_id_idx` (`album_id`) ) ENGINE = InnoDB;
    
    