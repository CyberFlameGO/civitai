-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- Slugify usernames
CREATE OR REPLACE FUNCTION slugify(input_string text) RETURNS text AS $$
BEGIN
    -- Replace spaces with underscores
    input_string := replace(input_string, ' ', '_');

    -- Remove non-alphanumeric characters
    input_string := regexp_replace(input_string, '[^a-zA-Z0-9_]', '', 'g');

    -- Convert to lowercase
    input_string := lower(input_string);

    RETURN input_string;
END;
$$ LANGUAGE plpgsql;

-- Get problem usernames
WITH cte_problems AS (
	SELECT slugify(username) AS username, COUNT(*), string_agg(username, ', ')
	FROM "User"
	WHERE username IS NOT NULL
	GROUP BY slugify(username)
	HAVING COUNT(*) > 1
)
SELECT id, row_number() OVER (ORDER BY 1) as temp_id
INTO TEMP TABLE problems
FROM "User"
WHERE slugify(username) IN (SELECT username from cte_problems);

-- Setup replacements
SELECT *
INTO TEMP TABLE temp_usernames
FROM (VALUES
  (1,'bucephala_clangula'), (2,'macropus_fuliginosus'), (3,'graspus_graspus'), (4,'tayassu_tajacu'), (5,'canis_aureus'), (6,'alligator_mississippiensis'), (7,'procyon_lotor'), (8,'cebus_nigrivittatus'), (9,'pavo_cristatus'), (10,'iguana_iguana'), (11,'balearica_pavonina'), (12,'phalacrocorax_varius'), (13,'gyps_bengalensis'), (14,'leptoptilus_dubius'), (15,'podargus_strigoides'), (16,'cordylus_giganteus'), (17,'eumetopias_jubatus'), (18,'macaca_nemestrina'), (19,'prionace_glauca'), (20,'callipepla_gambelii'), (21,'herpestes_javanicus'), (22,'thamnolaea_cinnmomeiventris'), (23,'varanus_komodensis'), (24,'spermophilus_armatus'), (25,'limnocorax_flavirostra'), (26,'terathopius_ecaudatus'), (27,'rhabdomys_pumilio'), (28,'castor_canadensis'), (29,'crocodylus_niloticus'), (30,'macropus_robustus'), (31,'taxidea_taxus'), (32,'tockus_flavirostris'), (33,'coluber_constrictor_foxii'), (34,'larus_dominicanus'), (35,'elephas_maximus_bengalensis'), (36,'laniaurius_atrococcineus'), (37,'cynictis_penicillata'), (38,'phalacrocorax_carbo'), (39,'paraxerus_cepapi'), (40,'chelodina_longicollis'), (41,'ninox_superciliaris'), (42,'plegadis_ridgwayi'), (43,'grus_antigone'), (44,'colaptes_campestroides'), (45,'ammospermophilus_nelsoni'), (46,'otaria_flavescens'), (47,'streptopelia_decipiens'), (48,'bettongia_penicillata'), (49,'camelus_dromedarius'), (50,'plegadis_falcinellus'), (51,'hystrix_indica'), (52,'thalasseus_maximus'), (53,'nycticorax_nycticorax'), (54,'morelia_spilotes_variegata'), (55,'neophron_percnopterus'), (56,'paradoxurus_hermaphroditus'), (57,'chauna_torquata'), (58,'diomedea_irrorata'), (59,'propithecus_verreauxi'), (60,'cathartes_aura'), (61,'chlamydosaurus_kingii'), (62,'equus_hemionus'), (63,'alopex_lagopus'), (64,'oryx_gazella_callotis'), (65,'fregata_magnificans'), (66,'tiliqua_scincoides'), (67,'funambulus_pennati'), (68,'ctenophorus_ornatus'), (69,'loris_tardigratus'), (70,'salvadora_hexalepis'), (71,'panthera_leo'), (72,'eudyptula_minor'), (73,'dasyurus_viverrinus'), (74,'lorythaixoides_concolor'), (75,'mirounga_angustirostris'), (76,'coluber_constrictor'), (77,'anhinga_rufa'), (78,'phascogale_calura'), (79,'lasiodora_parahybana'), (80,'dipodomys_deserti'), (81,'phylurus_milli'), (82,'madoqua_kirkii'), (83,'aquila_chrysaetos'), (84,'giraffe_camelopardalis'), (85,'unavailable'), (86,'anitibyx_armatus'), (87,'climacteris_melanura'), (88,'tachybaptus_ruficollis'), (89,'cervus_duvauceli'), (90,'lycaon_pictus'), (91,'pitangus_sulphuratus'), (92,'ara_ararauna'), (93,'uraeginthus_bengalus'), (94,'equus_burchelli'), (95,'alcelaphus_buselaphus_cokii'), (96,'petaurus_norfolcensis'), (97,'varanus_salvator'), (98,'phacochoerus_aethiopus'), (99,'sylvicapra_grimma'), (100,'canis_lupus_baileyi'), (101,'macaca_radiata'), (102,'crotalus_triseriatus'), (103,'galago_crassicaudataus'), (104,'ciconia_ciconia'), (105,'naja_haje'), (106,'tayassu_pecari'), (107,'anthropoides_paradisea'), (108,'lemur_fulvus'), (109,'eutamias_minimus'), (110,'tursiops_truncatus'), (111,'tamiasciurus_hudsonicus'), (112,'oxybelis_fulgidus'), (113,'varanus_sp'), (114,'lepus_arcticus'), (115,'gazella_granti'), (116,'tringa_glareola'), (117,'ploceus_rubiginosus'), (118,'odocoileus_hemionus'), (119,'cynomys_ludovicianus'), (120,'estrilda_erythronotos'), (121,'haliaeetus_leucocephalus'), (122,'boa_constrictor_mexicana'), (123,'platalea_leucordia'), (124,'pseudalopex_gymnocercus'), (125,'felis_concolor'), (126,'spermophilus_lateralis'), (127,'panthera_tigris'), (128,'cabassous_sp'), (129,'stercorarius_longicausus'), (130,'gerbillus_sp'), (131,'anser_caerulescens'), (132,'rangifer_tarandus'), (133,'aegypius_occipitalis'), (134,'loxodonta_africana'), (135,'cebus_albifrons'), (136,'colobus_guerza'), (137,'lamprotornis_chalybaeus'), (138,'oryx_gazella'), (139,'cereopsis_novaehollandiae'), (140,'agelaius_phoeniceus'), (141,'martes_pennanti'), (142,'lemur_catta'), (143,'eubalaena_australis'), (144,'echimys_chrysurus'), (145,'sula_nebouxii'), (146,'caiman_crocodilus'), (147,'canis_lupus'), (148,'bos_taurus'), (149,'leprocaulinus_vipera'), (150,'macropus_agilis'), (151,'spheniscus_magellanicus'), (152,'spermophilus_parryii'), (153,'leptoptilos_crumeniferus'), (154,'actophilornis_africanus'), (155,'streptopelia_senegalensis'), (156,'chordeiles_minor'), (157,'papio_cynocephalus'), (158,'sarkidornis_melanotos'), (159,'capreolus_capreolus'), (160,'gazella_thompsonii'), (161,'rhea_americana'), (162,'panthera_leo_persica'), (163,'cebus_apella'), (164,'ursus_americanus'), (165,'columba_palumbus'), (166,'agkistrodon_piscivorus'), (167,'vulpes_chama'), (168,'ramphastos_tucanus'), (169,'ursus_arctos'), (170,'phalacrocorax_niger'), (171,'coendou_prehensilis'), (172,'struthio_camelus'), (173,'threskionis_aethiopicus'), (174,'crax_sp'), (175,'delphinus_delphis'), (176,'acanthaster_planci'), (177,'cyrtodactylus_louisiadensis'), (178,'merops_nubicus'), (179,'aonyx_capensis'), (180,'falco_peregrinus'), (181,'mellivora_capensis'), (182,'hystrix_cristata'), (183,'varanus_albigularis'), (184,'zalophus_californicus'), (185,'mungos_mungo'), (186,'laniarius_ferrugineus'), (187,'bubo_sp'), (188,'cracticus_nigroagularis'), (189,'butorides_striatus'), (190,'macaca_fuscata'), (191,'haliaetus_leucogaster'), (192,'semnopithecus_entellus'), (193,'ratufa_indica'), (194,'rana_sp'), (195,'zenaida_asiatica'), (196,'ciconia_episcopus'), (197,'tamandua_tetradactyla'), (198,'mycteria_ibis'), (199,'buteo_jamaicensis'), (200,'sula_dactylatra'), (201,'pycnonotus_nigricans'), (202,'zonotrichia_capensis'), (203,'phascogale_tapoatafa'), (204,'mirounga_leonina'), (205,'suricata_suricatta'), (206,'cervus_canadensis'), (207,'heloderma_horridum'), (208,'cochlearius_cochlearius'), (209,'psophia_viridis'), (210,'ceratotherium_simum'), (211,'gymnorhina_tibicen'), (212,'papilio_canadensis'), (213,'cacatua_galerita'), (214,'francolinus_leucoscepus'), (215,'ovibos_moschatus'), (216,'lama_guanicoe'), (217,'perameles_nasuta'), (218,'nasua_nasua'), (219,'macropus_eugenii'), (220,'plectopterus_gambensis'), (221,'mabuya_spilogaster'), (222,'pycnonotus_barbatus'), (223,'oreamnos_americanus'), (224,'ara_chloroptera'), (225,'felis_wiedi_or_leopardus_weidi'), (226,'agouti_paca'), (227,'marmota_flaviventris'), (228,'bucorvus_leadbeateri'), (229,'tadorna_tadorna'), (230,'ardea_golieth'), (231,'speothos_vanaticus'), (232,'theropithecus_gelada'), (233,'corallus_hortulanus_cooki'), (234,'libellula_quadrimaculata'), (235,'tachyglossus_aculeatus'), (236,'epicrates_cenchria_maurus'), (237,'picoides_pubescens'), (238,'felis_silvestris_lybica'), (239,'panthera_onca'), (240,'bassariscus_astutus'), (241,'nectarinia_chalybea'), (242,'uraeginthus_granatina'), (243,'physignathus_cocincinus'), (244,'cercopithecus_aethiops'), (245,'pan_troglodytes'), (246,'manouria_emys'), (247,'myiarchus_tuberculifer'), (248,'pterocles_gutturalis'), (249,'tauraco_porphyrelophus'), (250,'haliaetus_vocifer'), (251,'macropus_parryi'), (252,'smithopsis_crassicaudata'), (253,'larus_fuliginosus'), (254,'choloepus_hoffmani'), (255,'lybius_torquatus'), (256,'ovis_ammon'), (257,'junonia_genoveua'), (258,'sciurus_vulgaris'), (259,'bison_bison'), (260,'spermophilus_richardsonii'), (261,'trichechus_inunguis'), (262,'parus_atricapillus'), (263,'vulpes_cinereoargenteus'), (264,'nesomimus_trifasciatus'), (265,'geochelone_radiata'), (266,'sciurus_niger'), (267,'psittacula_krameri'), (268,'dasypus_novemcinctus'), (269,'macropus_rufus'), (270,'haematopus_ater'), (271,'cygnus_atratus'), (272,'hyaena_brunnea'), (273,'petaurus_breviceps'), (274,'helogale_undulata'), (275,'dasypus_septemcincus'), (276,'sus_scrofa'), (277,'eremophila_alpestris'), (278,'pelecanus_conspicillatus'), (279,'buteo_galapagoensis'), (280,'cacatua_tenuirostris'), (281,'orcinus_orca'), (282,'pteronura_brasiliensis'), (283,'zosterops_pallidus'), (284,'ovis_canadensis'), (285,'creagrus_furcatus'), (286,'meleagris_gallopavo'), (287,'gabianus_pacificus'), (288,'hymenolaimus_malacorhynchus'), (289,'eolophus_roseicapillus'), (290,'grus_rubicundus'), (291,'columba_livia'), (292,'carduelis_pinus'), (293,'globicephala_melas'), (294,'panthera_pardus'), (295,'myotis_lucifugus'), (296,'pelecans_onocratalus'), (297,'anathana_ellioti'), (298,'bubalornis_niger'), (299,'erinaceus_frontalis'), (300,'acrantophis_madagascariensis'), (301,'sylvilagus_floridanus'), (302,'xerus_sp'), (303,'aepyceros_mylampus'), (304,'sagittarius_serpentarius'), (305,'gekko_gecko'), (306,'francolinus_coqui'), (307,'hippotragus_equinus'), (308,'connochaetus_taurinus'), (309,'martes_americana'), (310,'neophoca_cinerea'), (311,'gorilla_gorilla'), (312,'ovis_dalli_stonei'), (313,'buteo_regalis'), (314,'papio_ursinus'), (315,'didelphis_virginiana'), (316,'toxostoma_curvirostre'), (317,'dusicyon_thous'), (318,'centrocercus_urophasianus'), (319,'sarcorhamphus_papa'), (320,'anastomus_oscitans'), (321,'spizaetus_coronatus'), (322,'acridotheres_tristis'), (323,'mustela_nigripes'), (324,'drymarchon_corias_couperi'), (325,'alcelaphus_buselaphus_caama'), (326,'felis_chaus'), (327,'lamprotornis_superbus'), (328,'choriotis_kori'), (329,'corvus_brachyrhynchos'), (330,'leipoa_ocellata'), (331,'phoenicopterus_ruber'), (332,'crotaphytus_collaris'), (333,'priodontes_maximus'), (334,'zenaida_galapagoensis'), (335,'ovis_musimon'), (336,'erethizon_dorsatum'), (337,'macaca_mulatta'), (338,'corythornis_cristata'), (339,'chamaelo_sp'), (340,'meles_meles'), (341,'lophoaetus_occipitalis'), (342,'castor_fiber'), (343,'cercatetus_concinnus'), (344,'lamprotornis_nitens'), (345,'pseudoleistes_virescens'), (346,'phascolarctos_cinereus'), (347,'kobus_vardonii_vardoni'), (348,'spheniscus_mendiculus'), (349,'catharacta_skua'), (350,'ephipplorhynchus_senegalensis'), (351,'mazama_gouazoubira'), (352,'egretta_thula'), (353,'dacelo_novaeguineae'), (354,'phalaropus_fulicarius'), (355,'tragelaphus_angasi'), (356,'vulpes_vulpes'), (357,'cervus_elaphus'), (358,'acrobates_pygmaeus'), (359,'vombatus_ursinus'), (360,'ictalurus_furcatus'), (361,'anser_anser'), (362,'phalaropus_lobatus'), (363,'dolichitus_patagonum'), (364,'spermophilus_tridecemlineatus'), (365,'eudromia_elegans'), (366,'vanellus_chilensis'), (367,'spilogale_gracilis'), (368,'gyps_fulvus'), (369,'thylogale_stigmatica'), (370,'bubo_virginianus'), (371,'microcavia_australis'), (372,'porphyrio_porphyrio'), (373,'odocoilenaus_virginianus'), (374,'anas_punctata'), (375,'bubulcus_ibis'), (376,'chlidonias_leucopterus'), (377,'alces_alces'), (378,'boa_caninus'), (379,'phoenicopterus_chilensis'), (380,'pelecanus_occidentalis'), (381,'certotrichas_paena'), (382,'mycteria_leucocephala'), (383,'potos_flavus'), (384,'neotis_denhami'), (385,'melursus_ursinus'), (386,'felis_pardalis'), (387,'hippopotamus_amphibius'), (388,'alopochen_aegyptiacus'), (389,'cygnus_buccinator'), (390,'aonyx_cinerea'), (391,'fratercula_corniculata'), (392,'hippotragus_niger'), (393,'tockus_erythrorhyncus'), (394,'felis_rufus'), (395,'callorhinus_ursinus'), (396,'sterna_paradisaea'), (397,'marmota_monax'), (398,'lepus_townsendii'), (399,'alectura_lathami'), (400,'phalacrocorax_albiventer'), (401,'trichosurus_vulpecula'), (402,'irania_gutteralis'), (403,'dicrostonyx_groenlandicus'), (404,'bubalus_arnee'), (405,'lutra_canadensis'), (406,'ateles_paniscus'), (407,'eurocephalus_anguitimens'), (408,'ara_macao'), (409,'canis_mesomelas'), (410,'crotalus_adamanteus'), (411,'antilocapra_americana'), (412,'pytilia_melba'), (413,'geochelone_elephantopus'), (414,'chionis_alba'), (415,'geochelone_elegans'), (416,'gopherus_agassizii'), (417,'felis_libyca'), (418,'felis_caracal'), (419,'sauromalus_obesus'), (420,'amblyrhynchus_cristatus'), (421,'ceryle_rudis'), (422,'nyctereutes_procyonoides'), (423,'dendrocitta_vagabunda'), (424,'ictonyx_striatus'), (425,'calyptorhynchus_magnificus'), (426,'turtur_chalcospilos'), (427,'pseudocheirus_peregrinus'), (428,'dendrohyrax_brucel'), (429,'phasianus_colchicus'), (430,'marmota_caligata'), (431,'oxybelis_sp'), (432,'macropus_giganteus'), (433,'macropus_rufogriseus'), (434,'upupa_epops'), (435,'genetta_genetta'), (436,'dendrocygna_viduata'), (437,'chloephaga_melanoptera'), (438,'aegypius_tracheliotus'), (439,'dicrurus_adsimilis'), (440,'lycosa_godeffroyi'), (441,'falco_mexicanus'), (442,'anas_bahamensis')
) t(id, username);

-- Replace problems with temp_usernames
UPDATE "User" u SET username = tu.username
FROM problems p
JOIN temp_usernames tu ON p.temp_id = tu.id
WHERE u.id = p.id;

-- Slugify all the things
UPDATE "User" SET username = slugify(username);