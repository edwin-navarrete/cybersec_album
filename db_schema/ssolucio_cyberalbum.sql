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
  `album_id` varchar(36) NOT NULL COMMENT 'Universal unique identifier for the album',
  `player_name` VARCHAR(150) DEFAULT NULL COMMENT 'Name of the player associated with the album',
  `started_on` bigint(20) NOT NULL COMMENT 'Timestamp when the album was started',
  `ended_on` bigint(20) DEFAULT NULL COMMENT 'Timestamp when the album was ended',
  `language` varchar(20) NOT NULL COMMENT 'Language used in the album',
  `os` tinytext DEFAULT NULL COMMENT 'Operating system associated with the album',
  `platform` tinytext DEFAULT NULL COMMENT 'Platform associated with the album',
  `browser` tinytext DEFAULT NULL COMMENT 'Browser used in the album',
  `version` tinytext DEFAULT NULL COMMENT 'Version information associated with the album',
  `is_mobile` tinyint(1) DEFAULT NULL COMMENT 'Flag indicating whether the album is accessed from a mobile device',
  PRIMARY KEY (`album_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci COMMENT='Table storing information about albums';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_answer`
--

DROP TABLE IF EXISTS `user_answer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_answer` (
  `user_answer_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Unique identifier for each user answer',
  `album_id` varchar(36) NOT NULL COMMENT 'Identifier of the album associated with the user answer',
  `question_id` int(11) NOT NULL COMMENT 'Identifier of the question associated with the user answer',
  `success` tinyint(1) DEFAULT NULL COMMENT 'Indicator of whether the user answered the question successfully',
  `latency` int(11) DEFAULT NULL COMMENT 'Time taken by the user to answer the question',
  `attempts` int(11) DEFAULT NULL COMMENT 'Number of attempts made by the user to answer the question',
  `answered_on` bigint(20) NOT NULL COMMENT 'Timestamp when the user answered the question',
  PRIMARY KEY (`user_answer_id`),
  KEY `album_id_idx` (`album_id`)
) ENGINE=InnoDB AUTO_INCREMENT=671 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci COMMENT='Table storing user answers to questions';
/*!40101 SET character_set_client = @saved_cs_client */;

ALTER TABLE `user_answer`
ADD CONSTRAINT `fk_user_answer_album_id`
FOREIGN KEY (`album_id`)
REFERENCES `album` (`album_id`)
ON DELETE CASCADE
ON UPDATE CASCADE;

--
-- Table structure for table `user_sticker`
--

DROP TABLE IF EXISTS `user_sticker`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_sticker` (
  `user_sticker_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Unique identifier for each user sticker',
  `album_id` varchar(36) NOT NULL COMMENT 'Identifier of the album associated with the user sticker',
  `sticker_id` int(11) NOT NULL COMMENT 'Identifier of the sticker',
  `in_album` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indicator of whether the sticker is in the album',
  `added_on` bigint(20) NOT NULL COMMENT 'Timestamp when the sticker was added to the user collection',
  PRIMARY KEY (`user_sticker_id`),
  KEY `album_id_idx` (`album_id`)
) ENGINE=InnoDB AUTO_INCREMENT=675 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci COMMENT='Table storing user stickers and their associations with albums';
/*!40101 SET character_set_client = @saved_cs_client */;

ALTER TABLE `user_sticker`
ADD CONSTRAINT `fk_user_sticker_album_id`
FOREIGN KEY (`album_id`)
REFERENCES `album` (`album_id`)
ON DELETE CASCADE
ON UPDATE CASCADE;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-04-30  9:13:30

-- Crear la tabla question

DROP TABLE question;
CREATE TABLE `question` (
  `question_id` SMALLINT UNSIGNED NOT NULL,
  `lang` varchar(10) NOT NULL,
  `type` varchar(10) NOT NULL,
  `question` text NOT NULL,
  `options` JSON,
  `solution` JSON,
  `difficulty` float NOT NULL,
  `feedback` text DEFAULT NULL,
  PRIMARY KEY (`question_id`,`lang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Table storing questions for the game';


TRUNCATE TABLE question;

-- Insertando las preguntas en español
INSERT INTO question (question_id, type, lang, question, options, solution, difficulty, feedback) VALUES
(1, 'single', 'en', 'What is security?', '["Related to trust", "The opposite of insecurity", "Necessity of the human being", "All of the above"]', '[3]', 1.4, 'The security is the foundation of trust and a fundamental human need.'),
(2, 'single', 'en', 'What is information security?', '["Securing computer equipment", "Securing company documents", "Securing information assets", "Securing digital information"]', '[2]', 1.7, 'Information security consists of protecting the confidentiality, integrity, and availability of information assets, such as data, systems, and networks, essential to an organization.'),
(3, 'single', 'en', 'Cybersecurity protects information in:', '["Digital format and interconnected systems", "Interconnected formats and digital systems", "Cyberspace", "Physical"]', '[0]', 2.1, 'This entails securing digitally stored data as well as protecting computer systems and networks that facilitate communication and information exchange.'),
(4, 'multiple', 'en', 'Which of these are information assets?', '["Web page", "Customer Emails", "Door of the Computing Center", "Written Documentation"]', '[0, 1, 3]', 2.4, 'Information assets are crucial elements for an organization and can exist in various forms.'),
(5, 'multiple', 'en', 'The dimensions of information security are:', '["Availability", "Ubiquity", "Integrity", "Confidentiality"]', '[0, 2, 3]', 1.9, 'The dimensions of information security are: availability, integrity, and confidentiality. Each plays a crucial role in protecting an organization''s information assets!'),
(6, 'single', 'en', 'The leak of information in an corporation would be an aspect to cover by:', '["Integrity", "Confidentiality", "Availability", "Quality"]', '[1]', 1.2, 'Confidentiality refers to the protection of sensitive information to prevent it from falling into unauthorized hands.'),
(7, 'single', 'en', 'Which of these pillars is NOT information security:', '["Availability", "Unit", "Integrity", "Confidentiality"]', '[1]', 0.7, 'The three pillars of information security are: confidentiality, integrity, and availability.'),
(8, 'single', 'en', 'A dissatisfied employee constitutes for the organization', '["A risk", "A vulnerability", "A threat", "A control"]', '[2]', 1.9, 'A dissatisfied employee poses a threat to the organization. Their dissatisfaction can represent a risk in terms of security and stability.'),
(9, 'single', 'en', 'Information security encompasses', '["Information Security", "Information Security and Cybersecurity", "Cybersecurity", "Security"]', '[1]', 0.9, 'Information security encompasses both cybersecurity and computer security, ensuring comprehensive protection of data and systems against threats and vulnerabilities.'),
(10, 'single', 'en', 'Computer attack specifically targeting leaders or senior managers', '["Whaling", "Vishing", "Phishing", "Pharming"]', '[0]', 2.0, 'A computer attack specifically targeted at leaders or top executives is known as ''Whaling''. These attacks often target key individuals within an organization.'),
(11, 'multiple', 'en', 'What are the impacts that a computer attack can cause in a corporation?', '["Financial", "Reputational", "Legal", "Health"]', '[0, 1, 2]', 2.1, 'A cyber attack can cause financial, reputational, and legal impacts on an entity. It is crucial to be prepared to prevent and manage these situations.'),
(12, 'single', 'en', 'What are the techniques of influence and manipulation used by adversaries?', '["Authority, Empathy", "Concession, Urgency", "Reciprocity, Nonverbal Language", "All of the above"]', '[3]', 0.8, 'Adversaries'' influence and manipulation techniques include authority, empathy, concession, urgency, reciprocity, and non-verbal language. Be aware to protect yourself!'),
(13, 'single', 'en', 'Which is NOT a form of protection?', '["Entry to suspicious links", "Backups", "Secure Passwords", "Double authentication factor"]', '[0]', 1.0, 'Avoiding suspicious links is not enough to protect yourself. Make backups, use strong passwords, and enable two-factor authentication for added security.'),
(14, 'single', 'en', 'A bad practice when backing up your data is:', '["Make incremental copies periodically", "Save them in two different places within the same building", "Select only the relevant information to copy", "Save the copy in an alternate location"]', '[1]', 1.9, 'A poor practice in backing up data is storing copies in two locations within the same building. Diversifying the location is crucial for enhanced security. Protect your information!'),
(15, 'single', 'en', 'Information security policies are:', '["Guidelines to protect information", "The catalog of Information Assets", "The list of risks of the corporation", "The documents nobody knows"]', '[0]', 0.6, 'These policies define the rules, procedures, and practices that an organization implements to ensure the security of its information assets.'),
(16, 'single', 'en', 'An error in a strong password is:', '["A combination of letters, numbers and characters", "Use a phrase from a favorite movie or poem", "Have easy-to-remember personal information", "Be 12 characters long"]', '[2]', 1.2, 'It is important to avoid using passwords with personal information, as they can be susceptible to security attacks.'),
(17, 'single', 'en', 'Risks can be divided into two broad categories:', '["Environmental and human", "Viruses and Phishing", "Loss of information and identity theft", "Input and output of equipment"]', '[0]', 1.7, 'Risks are divided into environmental and human factors.'),
(18, 'single', 'en', 'A public personal data is that which:', '["It is of an intimate nature, it only interests the holder", "It is of interest for the holder and for a specific sector", "With its improper use, discrimination can be generated", "It can be consulted by anyone without the consent of the owner"]', '[3]', 1.8, 'Public personal data is information accessible to anyone without restrictions.'),
(19, 'single', 'en', 'This is an example of sensitive data:', '["Name", "Health Information", "The phone number", "Date and place of birth"]', '[1]', 1.3, 'An example of sensitive data is health information. It is crucial to protect this type of data to ensure privacy and security.'),
(20, 'single', 'en', 'A human factor physical threat:', '["Information theft", "Equipment damage due to voltage change", "Data Center flood", "Earthquake"]', '[0]', 2.0, 'A physical threat of a human factor would be information theft. It is important to protect data against possible malicious actions. Other threat factors are environmental in nature.'),
(21, 'multiple', 'en', 'Threat classes:', '["Deliberate, Accidental", "Imaginary, real", "Internal, External", "Environmental"]', '[0, 2, 3]', 3.0, 'Threat classes include deliberate and accidental, as well as internal, external, and environmental. Being aware of all of them is important to protect information security.'),
(22, 'multiple', 'en', 'These are vulnerability classes:', '["Deliberate, Accidental", "Internal, External", "Hardware, Software", "Staff, Organization"]', '[3, 4]', 3.0, 'Vulnerability classes include those related to hardware, software, and personal or organizational aspects. It is crucial to identify and address each one to maintain information security.');

-- Insertando las preguntas en inglés
INSERT INTO question (question_id, type, lang, question, options, solution, difficulty, feedback) VALUES
(1, 'single', 'es', '¿Qué es seguridad?', '["Relativo a confianza", "Lo contrario de inseguridad", "Necesidad del ser humano", "Todas las anteriores"]', '[3]', 1.4, 'La seguridad es la base de la confianza y una necesidad humana fundamental.'),
(2, 'single', 'es', '¿Qué es seguridad de información?', '["Asegurar los equipos informáticos", "Asegurar los documentos de la empresa", "Asegurar los activos de información", "Asegurar la información digital"]', '[2]', 1.7, 'La seguridad de la información consiste en proteger la confidencialidad, integridad y disponibilidad de los activos de información, como datos, sistemas y redes, esenciales para una organización.'),
(3, 'single', 'es', 'La ciberseguridad protege información en:', '["Formato digital y sistemas interconectados", "Formatos interconectados y sistemas digitales", "Ciberespacio", "Espacio Cibernético"]', '[0]', 2.1, 'Esto implica asegurar los datos almacenados digitalmente, así como proteger los sistemas informáticos y las redes que facilitan la comunicación y el intercambio de información.'),
(4, 'multiple', 'es', '¿Cuál de estos son activos de información?', '["Pagina web", "Correos electrónicos de clientes", "Puerta del Centro de Cómputo", "Documentación escrita"]', '[0, 1, 3]', 2.4, 'Los activos de información son elementos cruciales para una organización y pueden existir en diversas formas.'),
(5, 'multiple', 'es', 'Las dimensiones de la seguridad de información son:', '["Disponibilidad", "Ubicuidad", "Integridad", "Confidencialidad"]', '[0, 2, 3]', 1.9, 'Las dimensiones de la seguridad de la información son: disponibilidad, integridad y confidencialidad. ¡Cada una juega un papel crucial en proteger los activos de información de una organización!'),
(6, 'single', 'es', 'La fuga de información en una entidad sería un aspecto a cubrir por:', '["Integridad", "Confidencialidad", "Disponibilidad", "Calidad"]', '[1]', 1.2, 'La confidencialidad se refiere a la protección de la información sensible para evitar que caiga en manos no autorizadas.'),
(7, 'single', 'es', 'Cuál de estos pilares, NO es de seguridad de información:', '["Disponibilidad", "Unidad", "Integridad", "Confidencialidad"]', '[1]', 0.7, 'Los 3 pilares de seguridad de la información son: confidencialidad, integridad y disponibilidad.'),
(8, 'single', 'es', 'Un empleado descontento constituye para la organización', '["Un riesgo", "Una vulnerabilidad", "Una amenaza", "Un control"]', '[2]', 1.9, 'Un empleado descontento constituye una amenaza para la organización. Su insatisfacción puede representar un riesgo en términos de seguridad y estabilidad.'),
(9, 'single', 'es', 'Seguridad de la información abarca', '["Seguridad Informática", "Seguridad Informática y Ciberseguridad", "Ciberseguridad", "Seguridad Cibernética"]', '[1]', 0.9, 'La seguridad de la información abarca la seguridad informática y la ciberseguridad. Garantizando la protección integral de los datos y sistemas ante amenazas y vulnerabilidades.'),
(10, 'single', 'es', 'Ataque informático especifícamente dirigido a líderes o altos directivos', '["Whaling", "Vishing", "Phishing", "Pharming"]', '[0]', 2.0, 'Un ataque informático específicamente dirigido a líderes o altos directivos se conoce como ''Whaling''. Estos ataques suelen apuntar a individuos clave en una organización.'),
(11, 'multiple', 'es', 'Cuáles son los impactos que puede causar un ataque informático en una entidad?', '["Financiero", "Reputacional", "Legal", "Salud"]', '[0, 1, 2]', 2.1, 'Un ataque informático puede causar impactos financieros, reputacionales y legales en una entidad. Es crucial estar preparados para prevenir y gestionar estas situaciones.'),
(12, 'single', 'es', '¿Cuáles son las técnicas de influencia y manipulación utilizadas por los adversarios?', '["Autoridad, Empatía", "Concesión, Urgencia ", "Reciprocidad, Lenguaje no verbal", "Todas las anteriores"]', '[3]', 0.8, 'Las técnicas de influencia y manipulación por adversarios incluyen autoridad, empatía, concesión, urgencia, reciprocidad y lenguaje no verbal. ¡Sé consciente para protegerte!'),
(13, 'single', 'es', '¿Cuál NO es una forma de protección?', '["Entrada a enlaces sospechosos", "Copias de Seguridad", "Contraseñas seguras", "Doble factor de autenticación"]', '[0]', 1.0, 'Evitar entrar a enlaces sospechosos NO protege. Haz copias de seguridad, usa contraseñas seguras y doble factor de autenticación para mayor seguridad.'),
(14, 'single', 'es', 'Una mala práctica al hacer la copias de seguridad de su información es:', '["Hacer copias incrementales de manera periódica", "Guardarlas en dos lugares diferentes dentro del mismo edificio", "Seleccionar solo la información relevante a copiar", "Guardar la copia en una sede alterna"]', '[1]', 1.9, 'Una mala práctica al hacer copias de seguridad es guardarlas en dos lugares dentro del mismo edificio. Es importante diversificar la ubicación para mayor seguridad. ¡Protege tu información!'),
(15, 'single', 'es', 'Las políticas de seguridad de información son:', '["Directrices para proteger la información", "El catálogo de activos de información", "La lista de los riesgos de la entidad", "Los documentos que nadie conoce"]', '[0]', 0.6, 'Estas políticas definen las reglas, procedimientos y prácticas que una organización implementa para garantizar la seguridad de sus activos de información.'),
(16, 'single', 'es', 'Un error en una contraseña segura es:', '["Una combinación de letras, números y caracteres", "Usar una frase de película o poema preferido", "Tener información personal de fácil recordación", "Tener una longitud de 12 caracteres"]', '[2]', 1.2, 'Es importante evitar el uso de contraseñas con información personal, ya que pueden ser susceptibles a ataques de seguridad.'),
(17, 'single', 'es', 'Los riesgos pueden dividirse en dos grandes categorías:', '["Ambientales y humanos", "Virus y phishing", "Pérdida de información y suplantación de identidad", "Entrada y salida de equipos"]', '[0]', 1.7, 'Los riesgos se dividen en ambientales y humanos.'),
(18, 'single', 'es', 'Un dato personal público es aquel que:', '["Es de naturaleza íntima, solo le interesa al titular", "Es de interés para el titular y para un sector específico", "Con su uso indebido se puede generar discriminación", "Puede ser consultado por cualquiera sin el consentimiento del titular"]', '[3]', 1.8, 'Un dato personal público es información accesible por cualquier persona sin restricciones.'),
(19, 'single', 'es', 'Es un ejemplo de dato sensible:', '["El nombre", "Información de salud", "El número telefónico", "Fecha y lugar de nacimiento"]', '[1]', 1.3, 'Un ejemplo de dato sensible es la información de salud. Es crucial proteger este tipo de datos para garantizar la privacidad y seguridad.'),
(20, 'single', 'es', 'Una amenaza física de factor humano:', '["Robo de información", "Daño de equipo por cambio de voltaje", "Inundación de centro de datos", "Terremoto"]', '[0]', 2.0, 'Una amenaza física de factor humano sería el robo de información. Es importante proteger los datos contra posibles acciones malintencionadas. Los otros factores de amenaza son de tipo ambiental.'),
(21, 'multiple', 'es', 'Son clases de amenazas:', '["Deliberada, Accidental", "Imaginarias, reales", "Internas, Externas", "Ambientales"]', '[0, 2, 3]', 3.0, 'Las clases de amenazas incluyen las deliberadas y accidentales, así como las internas, externas y ambientales. Es importante estar al tanto de todas ellas para proteger la seguridad de la información.'),
(22, 'multiple', 'es', 'Son clases de vulnerabilidades:', '["Deliberada, Accidental ", "Interna, Externa", "Hardware, Software", "Personal, Organización"]', '[3, 4]', 3.0, 'Las clases de vulnerabilidades incluyen las relacionadas con hardware, software y las personales u organizacionales. Es crucial identificar y abordar cada una para mantener la seguridad de la información.');

CREATE VIEW vw_user_answer AS
SELECT u.album_id, u.question_id, MAX(u.success) success, SUM(u.latency) latency, SUM(u.attempts) attempts, MAX(u.answered_on) answered_on -- SELECT u.album_id, u.question_id, count(*)
FROM user_answer u
GROUP BY u.album_id, u.question_id;

-- Removing duplicates
CREATE TEMPORARY TABLE unique_user_sticker AS
SELECT MAX(user_sticker_id) AS user_sticker_id
FROM user_sticker
GROUP BY album_id, sticker_id;

DELETE FROM user_sticker
WHERE user_sticker_id NOT IN (SELECT user_sticker_id FROM unique_user_sticker);

DROP TEMPORARY TABLE unique_user_sticker;

-- Crear el índice único
ALTER TABLE user_sticker ADD UNIQUE KEY (album_id, sticker_id);

-- Adding player table
ALTER TABLE album ADD COLUMN player_id MEDIUMINT UNSIGNED;

CREATE TABLE `player` (
  `player_id` mediumint unsigned NOT NULL AUTO_INCREMENT,
  `player_name` varchar(80) NOT NULL,
  `is_group` tinyint(1) DEFAULT '0',
  `group_id` mediumint unsigned DEFAULT NULL,
  `is_leader` tinyint(1) DEFAULT NULL,
  `added_on` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `modified_on` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`player_id`),
  UNIQUE KEY `player_name` (`player_name`),
  UNIQUE KEY `group_id` (`group_id`,`is_leader`)
) ENGINE=InnoDB AUTO_INCREMENT=653 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
