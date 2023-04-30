-- MySQL dump 10.19  Distrib 10.3.38-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: ssolucio_cyberalbum
-- ------------------------------------------------------
-- Server version	10.3.38-MariaDB-cll-lve

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `album`
--

DROP TABLE IF EXISTS `album`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `album` (
  `album_id` varchar(36) NOT NULL,
  `started_on` bigint(20) NOT NULL,
  `ended_on` bigint(20) DEFAULT NULL,
  `language` varchar(20) NOT NULL,
  `os` tinytext DEFAULT NULL,
  `platform` tinytext DEFAULT NULL,
  `browser` tinytext DEFAULT NULL,
  `version` tinytext DEFAULT NULL,
  `is_mobile` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`album_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

CREATE VIEW vw_user_answer AS
SELECT u.album_id, u.question_id, MAX(u.success) success, SUM(u.latency) latency, SUM(u.attempts) attempts, MAX(u.answered_on) answered_on -- SELECT u.album_id, u.question_id, count(*)
FROM user_answer u
GROUP BY u.album_id, u.question_id;


--
-- Table structure for table `user_answer`
--

DROP TABLE IF EXISTS `user_answer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_answer` (
  `user_answer_id` int(11) NOT NULL AUTO_INCREMENT,
  `album_id` varchar(36) NOT NULL,
  `question_id` int(11) NOT NULL,
  `success` tinyint(1) DEFAULT NULL,
  `latency` int(11) DEFAULT NULL,
  `attempts` int(11) DEFAULT NULL,
  `answered_on` bigint(20) NOT NULL,
  PRIMARY KEY (`user_answer_id`),
  KEY `album_id_idx` (`album_id`)
) ENGINE=InnoDB AUTO_INCREMENT=671 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_sticker`
--

DROP TABLE IF EXISTS `user_sticker`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_sticker` (
  `user_sticker_id` int(11) NOT NULL AUTO_INCREMENT,
  `album_id` varchar(36) NOT NULL,
  `sticker_id` int(11) NOT NULL,
  `in_album` tinyint(1) NOT NULL DEFAULT 0,
  `added_on` bigint(20) NOT NULL,
  PRIMARY KEY (`user_sticker_id`),
  KEY `album_id_idx` (`album_id`)
) ENGINE=InnoDB AUTO_INCREMENT=675 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;


/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-04-30  9:13:30
