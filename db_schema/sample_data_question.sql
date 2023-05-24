-- MySQL dump 10.13  Distrib 8.0.33, for Win64 (x86_64)
--
-- Host: localhost    Database: ssolucio_cyberalbum
-- ------------------------------------------------------
-- Server version	8.0.33

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `question`
--

LOCK TABLES `question` WRITE;
/*!40000 ALTER TABLE `question` DISABLE KEYS */;
INSERT INTO `question` VALUES (1,'SINGLE','es','¿Qué es seguridad?','[\"Relativo a confianza\", \"Lo contrario de inseguridad\", \"Necesidad del ser humano\", \"Todas las anteriores\"]','3','Recuerda que seguridad en el sentido más amplio incluye la protección de miembros de un grupo contra daños así como la percepción individual del riesgo.',0.4),(2,'SINGLE','es','¿Qué es seguridad de información?','[\"Asegurar los equipos informáticos\", \"Asegurar los documentos de la empresa\", \"Asegurar los activos de información\", \"Asegurar la información digital\"]','2','',0.3),(3,'SINGLE','es','La ciberseguridad protege información en:','[\"Formato digital y sistemas interconectados\", \"Formatos interconectados y sistemas digitales\", \"Ciberespacio\", \"Espacio Cibernético\"]','0','',0.4),(4,'SINGLE','es','¿Cuál de estos son activos de información?','[\"Pagina web\", \"Correos electrónicos de clientes\", \"Puerta del Centro de Cómputo\", \"Documentación escrita\"]','0','',0.4),(5,'MULTIPLE','es','Las dimensiones de la seguridad de información son:','[\"Disponibilidad\", \"Ubicuidad\", \"Integridad\", \"Confidencialidad\"]','0','',0.3),(6,'SINGLE','es','La fuga de información en una entidad sería un aspecto a cubrir por:','[\"Integridad\", \"Confidencialidad\", \"Disponibilidad\", \"Calidad\"]','1','',0.5),(7,'SINGLE','es','Cuál de estos pilares, NO es de seguridad de información:','[\"Disponibilidad\", \"Unidad\", \"Integridad\", \"Confidencialidad\"]','1','',0.4),(8,'SINGLE','es','Un empleado descontento constituye para la organización','[\"Un riesgo\", \"Una vulnerabilidad\", \"Una amenaza\", \"Un control\"]','2','',0.6),(9,'SINGLE','es','Seguridad de la información abarca','[\"Seguridad Informática\", \"Seguridad Informática y Ciberseguridad\", \"Ciberseguridad\", \"Seguridad Cibernética\"]','1','',0.5),(10,'SINGLE','es','Ataque informático especifícamente dirigido a líderes o altos directivos','[\"Whaling\", \"Vishing\", \"Phishing\", \"Pharming\"]','0','',0.5),(11,'MULTIPLE','es','Cuáles son los impactos que puede causar un ataque informático en una entidad?','[\"Financiero\", \"Reputacional\", \"Legal\", \"Salud\"]','0','',0.6),(12,'SINGLE','es','¿Cuáles son las técnicas de influencia y manipulación utilizadas por los adversarios?','[\"Autoridad, Empatía\", \"Concesión, Urgencia \", \"Reciprocidad, Lenguaje no verbal\", \"Todas las anteriores\"]','3','',0.6),(13,'SINGLE','es','¿Cuál NO es una forma de protección?','[\"Entrada a enlaces sospechosos\", \"Copias de Seguridad\", \"Contraseñas seguras\", \"Doble factor de autenticación\"]','0','',0.4),(14,'SINGLE','es','Una mala práctica al hacer la copias de seguridad de su información es:','[\"Hacer copias incrementales de manera periódica\", \"Guardarlas en dos lugares diferentes dentro del mismo edificio\", \"Seleccionar solo la información relevante a copiar\", \"Guardar la copia en una sede alterna\"]','1','',0.6),(15,'SINGLE','es','Las políticas de seguridad de información son:','[\"Directrices para proteger la información\", \"El catálogo de activos de información\", \"La lista de los riesgos de la entidad\", \"Los documentos que nadie conoce\"]','0','',0.6),(16,'SINGLE','es','Un error en una contraseña segura es:','[\"Una combinación de letras, números y caracteres\", \"Usar una frase de película o poema preferido\", \"Tener información personal de fácil recordación\", \"Tener una longitud de 12 caracteres\"]','2','',0.6),(17,'SINGLE','es','Los riesgos pueden dividirse en dos grandes categorías:','[\"Ambientales y humanos\", \"Virus y phishing\", \"Pérdida de información y suplantación de identidad\", \"Entrada y salida de equipos\"]','0','',0.5),(18,'SINGLE','es','Un dato personal público es aquel que:','[\"Es de naturaleza íntima, solo le interesa al titular\", \"Es de interés para el titular y para un sector específico\", \"Con su uso indebido se puede generar discriminación\", \"Puede ser consultado por cualquiera sin el consentimiento del titular\"]','3','',0.6),(19,'SINGLE','es','Es un ejemplo de dato sensible:','[\"El nombre\", \"Información de salud\", \"El número telefónico\", \"Fecha y lugar de nacimiento\"]','1','',0.6),(20,'SINGLE','es','Una amenaza física de factor humano:','[\"Robo de información\", \"Daño de equipo por cambio de voltaje\", \"Inundación de centro de datos\", \"Terremoto\"]','0','',0.7),(21,'MULTIPLE','es','Son clases de amenazas:','[\"Deliberada, Accidental\", \"Imaginarias, reales\", \"Internas, Externas\", \"Ambientales\"]','0','',0.7),(22,'MULTIPLE','es','Son clases de vulnerabilidades:','[\"Deliberada, Accidental \", \"Red, Lugar\", \"Hardware, Software\", \"Personal, Organización\"]','1','',0.7);
/*!40000 ALTER TABLE `question` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-05-24 18:39:57
