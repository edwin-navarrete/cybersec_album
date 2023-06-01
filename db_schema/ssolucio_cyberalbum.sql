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

-- Crear la tabla question

CREATE TABLE question (
  id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  type VARCHAR(10) NOT NULL,
  lang VARCHAR(10) NOT NULL,
  question TEXT NOT NULL,
  options JSON NOT NULL,
  solution JSON NOT NULL,
  difficulty FLOAT NOT NULL,
  feedback TEXT,
);

-- Cambiar un valor en una celda específica
UPDATE question
SET type = 'multiple'
WHERE id = <id_de_la_pregunta>;

-- Insertando las preguntas en español
INSERT INTO question (type, lang, question, options, solution, difficulty, feedback) VALUES
('single', 'ES', '¿Qué es seguridad?', '["Relativo a confianza", "Lo contrario de inseguridad", "Necesidad del ser humano", "Todas las anteriores"]', '[3]', 0.4, 'Recuerda que seguridad en el sentido más amplio incluye la protección de miembros de un grupo contra daños así como la percepción individual del riesgo.'),
('single', 'ES', '¿Qué es seguridad de información?', '["Asegurar los equipos informáticos", "Asegurar los documentos de la empresa", "Asegurar los activos de información", "Asegurar la información digital"]', '[2]', 0.3, NULL),
('single', 'ES', 'La ciberseguridad protege información en:', '["Formato digital y sistemas interconectados", "Formatos interconectados y sistemas digitales", "Ciberespacio", "Espacio Cibernético"]', '[0]', 0.4, NULL),
('multiple', 'ES', '¿Cuál de estos son activos de información?', '["Pagina web", "Correos electrónicos de clientes", "Puerta del Centro de Cómputo", "Documentación escrita"]', '[0, 1, 3]', 0.4, NULL),
('multiple', 'ES', 'Las dimensiones de la seguridad de información son:', '["Disponibilidad", "Ubicuidad", "Integridad", "Confidencialidad"]', '[0, 2, 3]', 0.3, NULL),
('single', 'ES', 'La fuga de información en una entidad sería un aspecto a cubrir por:', '["Integridad", "Confidencialidad", "Disponibilidad", "Calidad"]', '[1]', 0.5, NULL),
('single', 'ES', 'Cuál de estos pilares, NO es de seguridad de información:', '["Disponibilidad", "Unidad", "Integridad", "Confidencialidad"]', '[1]', 0.4, NULL),
('single', 'ES', 'Un empleado descontento constituye para la organización', '["Un riesgo", "Una vulnerabilidad", "Una amenaza", "Un control"]', '[2]', 0.6, NULL),
('single', 'ES', 'Seguridad de la información abarca', '["Seguridad Informática", "Seguridad Informática y Ciberseguridad", "Ciberseguridad", "Seguridad Cibernética"]', '[1]', 0.5, NULL),
('single', 'ES', 'Ataque informático especifícamente dirigido a líderes o altos directivos', '["Whaling", "Vishing", "Phishing", "Pharming"]', '[0]', 0.5, NULL),
('multiple', 'ES', 'Cuáles son los impactos que puede causar un ataque informático en una entidad?', '["Financiero", "Reputacional", "Legal", "Salud"]', '[0, 1, 2]', 0.6, NULL),
('single', 'ES', '¿Cuáles son las técnicas de influencia y manipulación utilizadas por los adversarios?', '["Autoridad, Empatía", "Concesión, Urgencia ", "Reciprocidad, Lenguaje no verbal", "Todas las anteriores"]', '[3]', 0.6, NULL),
('single', 'ES', '¿Cuál NO es una forma de protección?', '["Entrada a enlaces sospechosos", "Copias de Seguridad", "Contraseñas seguras", "Doble factor de autenticación"]', '[0]', 0.4, NULL),
('single', 'ES', 'Una mala práctica al hacer la copias de seguridad de su información es:', '["Hacer copias incrementales de manera periódica", "Guardarlas en dos lugares diferentes dentro del mismo edificio", "Seleccionar solo la información relevante a copiar", "Guardar la copia en una sede alterna"]', '[1]', 0.6, NULL),
('single', 'ES', 'Las políticas de seguridad de información son:', '["Directrices para proteger la información", "El catálogo de activos de información", "La lista de los riesgos de la entidad", "Los documentos que nadie conoce"]', '[0]', 0.6, NULL),
('single', 'ES', 'Un error en una contraseña segura es:', '["Una combinación de letras, números y caracteres", "Usar una frase de película o poema preferido", "Tener información personal de fácil recordación", "Tener una longitud de 12 caracteres"]', '[2]', 0.6, NULL),
('single', 'ES', 'Los riesgos pueden dividirse en dos grandes categorías:', '["Ambientales y humanos", "Virus y phishing", "Pérdida de información y suplantación de identidad", "Entrada y salida de equipos"]', '[0]', 0.5, NULL),
('single', 'ES', 'Un dato personal público es aquel que:', '["Es de naturaleza íntima, solo le interesa al titular", "Es de interés para el titular y para un sector específico", "Con su uso indebido se puede generar discriminación", "Puede ser consultado por cualquiera sin el consentimiento del titular"]', '[3]', 0.6, NULL),
('single', 'ES', 'Es un ejemplo de dato sensible:', '["El nombre", "Información de salud", "El número telefónico", "Fecha y lugar de nacimiento"]', '[1]', 0.6, NULL),
('single', 'ES', 'Una amenaza física de factor humano:', '["Robo de información", "Daño de equipo por cambio de voltaje", "Inundación de centro de datos", "Terremoto"]', '[0]', 0.7, NULL),
('multiple', 'ES', 'Son clases de amenazas:', '["Deliberada, Accidental", "Imaginarias, reales", "Internas, Externas", "Ambientales"]', '[0, 1, 3]', 0.7, NULL),
('multiple', 'ES', 'Son clases de vulnerabilidades:', '["Deliberada, Accidental ", "Red, Lugar", "Hardware, Software", "Personal, Organización"]', '[1, 2, 3]', 0.7, NULL);


-- Insertando las preguntas en inglés
INSERT INTO question (type, lang, question, options, solution, difficulty, feedback) VALUES
('single', 'EN', 'What is security?', '["Related to trust", "The opposite of insecurity", "Necessity of the human being", "All of the above"]', '[3]', 0.4, 'Remember that security in the broadest sense includes the protection of members of a group from harm as well as individual perception of risk.'),
('single', 'EN', 'What is information security?', '["Securing computer equipment", "Securing company documents", "Securing information assets", "Securing digital information"]', '[2]', 0.5, NULL),
('single', 'EN', 'Cybersecurity protects information in:', '["Digital format and interconnected systems", "Interconnected formats and digital systems", "Cyberspace", "Physical"]', '[0]', 0.7, NULL),
('multiple', 'EN', 'Which of these are information assets?', '["Web page", "Customer Emails", "Door of the Computing Center", "Written Documentation"]', '[0, 1, 3]', 0.8, NULL),
('multiple', 'EN', 'The dimensions of information security are:', '["Availability", "Ubiquity", "Integrity", "Confidentiality"]', '[0, 2, 3]', 0.8, NULL),
('single', 'EN', 'The leak of information in an corporation would be an aspect to cover by:', '["Integrity", "Confidentiality", "Availability", "Quality"]', '[1]', 0.6, NULL),
('single', 'EN', 'Which of these pillars is NOT information security:', '["Availability", "Unit", "Integrity", "Confidentiality"]', '[1]', 0.4, NULL),
('single', 'EN', 'A dissatisfied employee constitutes for the organization', '["A risk", "A vulnerability", "A threat", "A control"]', '[2]', 0.7, NULL),
('single', 'EN', 'Information security encompasses', '["Information Security", "Information Security and Cybersecurity", "Cybersecurity", "Security"]', '[2]', 0.7, NULL),
('single', 'EN', 'Computer attack specifically targeting leaders or senior managers', '["Whaling", "Vishing", "Phishing", "Pharming"]', '[0]', 0.8, NULL),
('multiple', 'EN', 'What are the impacts that a computer attack can cause in a corporation?', '["Financial", "Reputational", "Legal", "Health"]', '[0, 1, 2]', 0.8, NULL),
('single', 'EN', 'What are the techniques of influence and manipulation used by adversaries?', '["Authority, Empathy", "Concession, Urgency", "Reciprocity, Nonverbal Language", "All of the above"]', '[3]', 0.9, NULL),
('single', 'EN', 'Which is NOT a form of protection?', '["Entry to suspicious links", "Backups", "Secure Passwords", "Double authentication factor"]', '[0]', 0.4, NULL),
('single', 'EN', 'A bad practice when backing up your data is:', '["Make incremental copies periodically", "Save them in two different places within the same building", "Select only the relevant information to copy", "Save the copy in an alternate location"]', '[1]', 0.7, NULL),
('single', 'EN', 'Information security policies are:', '["Guidelines to protect information", "The catalog of Information Assets", "The list of risks of the corporation", "The documents nobody knows"]', '[0]', 0.6, NULL),
('single', 'EN', 'An error in a strong password is:', '["A combination of letters, numbers and characters", "Use a phrase from a favorite movie or poem", "Have easy-to-remember personal information", "Be 12 characters long"]', '[2]', 0.7, NULL),
('single', 'EN', 'Risks can be divided into two broad categories:', '["Environmental and human", "Viruses and Phishing", "Loss of information and identity theft", "Input and output of equipment"]', '[0]', 0.6, NULL),
('single', 'EN', 'A public personal data is that which:', '["It is of an intimate nature, it only interests the holder", "It is of interest for the holder and for a specific sector", "With its improper use, discrimination can be generated", "It can be consulted by anyone without the consent of the owner"]', '[3]', 0.7, NULL),
('single', 'EN', 'This is an example of sensitive data:', '["Name", "Health Information", "The phone number", "Date and place of birth"]', '[1]', 0.6, NULL),
('single', 'EN', 'A human factor physical threat:', '["Information theft", "Equipment damage due to voltage change", "Data Center flood", "Earthquake"]', '[0]', 0.7, NULL),
('multiple', 'EN', 'Threat classes:', '["Deliberate, Accidental", "Imaginary, real", "Internal, External", "Environmental"]', '[0, 1, 3]', 0.9, NULL),
('multiple', 'EN', 'These are vulnerability classes:', '["Deliberate, Accidental", "Network, Place", "Hardware,Software", "Staff, Organization"]', '[1, 2, 3]', 0.9, NULL);
