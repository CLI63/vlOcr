-- MySQL dump 10.13  Distrib 5.5.62, for Win64 (AMD64)
--
-- Host: localhost    Database: myocr
-- ------------------------------------------------------
-- Server version	5.5.62-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `img_history`
--

DROP TABLE IF EXISTS `img_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `img_history` (
  `id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `imgUrl` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL,
  `imgSrc` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL,
  `fileMd5` varchar(32) COLLATE utf8_unicode_ci DEFAULT NULL,
  `ocrText` text COLLATE utf8_unicode_ci,
  `modelName` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `allModel` text COLLATE utf8_unicode_ci,
  `ocrInfo` text COLLATE utf8_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_img_history_fileMd5` (`fileMd5`),
  KEY `idx_img_history_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `img_history`
--

LOCK TABLES `img_history` WRITE;
/*!40000 ALTER TABLE `img_history` DISABLE KEYS */;
INSERT INTO `img_history` VALUES ('38f55e5b-5cd0-4ed9-8ef0-7a233b501dce','http://cwxt.ctce.com.cn:9981/api/LoadImage?uid=7eb32c99-3516-440a-8ea4-3164984bc630-2025-08-07-08-22-58-2258&signaturetime=1754526752370&signaturedata=c9bbf5d0f7cfa4bdb6c0f4987e7097d0&appid=10002&fullfilename=5a48df44-02cf-4286-a36c-ae1eaf999830.jpg','F:\\CEISHI\\node\\vlmOcr\\public\\images\\dc86ef440b40c7051383ec1d1d5e52a3.jpg','dc86ef440b40c7051383ec1d1d5e52a3','农民工工资支付单〈退回重付)分包方名称〈全称):合肥增优建材有限公司工资所属月份:2025年3月2%.元mel好名|。身份证号|本月实付(元)开户行名称|区|名注|四FEOOOOOEOIECIITIITORCTTTZITEIEESN[人|]入ml|ll|分包方负责人签字:训作年分包方名称〈盖章):nan本人fs《5<%5入二有&33“wFuepRPg扫描人:胡冰浅','农名工工资单','[{\"modelName\":\"农名工工资单\",\"keyWords\":[\"工资支付单\",\"分包方名称\",\"工资所属\",\"本月实付\"],\"score\":12}]','{\"单据类型\":\"农民工工资支付单\",\"单据子类型\":\"退回重付\",\"分包方名称\":\"合肥增优建材有限公司\",\"工资所属月份\":\"2025年3月\",\"金额单位\":\"元\",\"员工信息\":[{\"序号\":1,\"姓名\":\"刘安平\",\"身份证号\":\"340822197907170211\",\"本月实付\":14000,\"银行账号\":\"6217866300003704633\",\"开户行名称\":\"中国银行怀宁月山支行\",\"签名\":\"刘安平\"}],\"合计人数\":1,\"合计本月实付\":14000,\"分包方负责人签字\":\"刘他率\",\"分包方名称盖章\":true,\"扫描人\":\"胡冰涛\"}','2025-08-07 09:28:39',NULL),('3d4106d3-e7a8-420c-a7e5-995bc4fea464','http://cwxt.ctce.com.cn:9981/api/LoadImage?uid=b04c065a-34c7-448c-8358-3c8d86befd55-2025-08-13-11-15-24-1524&signaturetime=1755055027604&signaturedata=7ead6f8da8d965c89f4b7642bc899f3&appid=10002&fullfilename=d5036ddf-eae1-43cc-8945-b864c3ce6539.jpg','C:\\node\\vlmOcr\\public\\images\\43dfcb9e6912b7c1541330fb44b5b631.jpg','43dfcb9e6912b7c1541330fb44b5b631','-ES:>主-这银行调户申请表单位名称:中铁四局集团有限公司第六工程分公司财务部mesosw]aa付款方户名中铁四局集团有限公司第六工程分公司B款—_—ITir-信一息付款方开户行中国建设银行股份有限公司陕西省分行营业部和四ET刑小2_=[am信-下息收坎方开户行中国建设银行股份有限公司陕西省分行营业部锣审核人;，医E下制单人:吴越2.”pAcEhTH5本二>¥-全二Ac扫描人:吴越0','银行调户申请单','[{\"modelName\":\"银行回单\",\"keyWords\":[\"付款\",\"银行\"],\"score\":4},{\"modelName\":\"银行调户申请单\",\"keyWords\":[\"付款\",\"调户申请\",\"银行调户\"],\"score\":12}]','{\"单位名称\":\"中铁四局集团有限公司第六工程分公司财务部\",\"申请日期\":\"2025-08-13\",\"调户金额\":{\"大写\":\"柒万元整\",\"小写\":\"¥70000.00\"},\"付款银行信息\":{\"付款方户名\":\"中铁四局集团有限公司第六工程分公司\",\"付款方账号\":\"61001902900052513129-0001\",\"付款方开户行\":\"中国建设银行股份有限公司陕西省分行营业部\"},\"收款银行信息\":{\"收款方户名\":\"中铁四局集团有限公司第六工程分公司\",\"收款方账号\":\"61001902900052513129-0003\",\"收款方开户行\":\"中国建设银行股份有限公司陕西省分行营业部\"},\"审核人\":\"张乾亮\",\"制单人\":\"吴越\",\"扫描人\":\"吴越\"}','2025-08-13 03:23:56',NULL),('4106d0be-1f6f-4475-b297-217847ab9f9e','http://cwxt.ctce.com.cn:9981/api/LoadImage?uid=85df189e-d8a1-46cf-92ec-dc26858c7019-2025-08-13-11-07-48-748&signaturetime=1755054576198&signaturedata=20dca56567c34a9201612e565be299e&appid=10002&fullfilename=8a64d106-2c2b-4eba-8209-8f2f8fbad2f1.jpg','C:\\node\\vlmOcr\\public\\images\\12ead65307fa9b1174136d091af51c45.jpg','12ead65307fa9b1174136d091af51c45','区<4AN=E=]银行调户申请表id单位名称:中铁四局集团建筑工程有限公司资金结算中心申请日期，2025.08-13必weCT|下21方名中针四局集团建筑工程有限公司大eeee1BEAT|二es全大ee|信|证|2[wors[rmeesmn本i,本审核人EER制单人，Fk本人让和扫描人:天咏','银行调户申请单','[{\"modelName\":\"银行回单\",\"keyWords\":[\"银行\"],\"score\":2},{\"modelName\":\"银行调户申请单\",\"keyWords\":[\"调户申请\",\"银行调户\"],\"score\":10}]','{\"标题\":\"银行调户申请表\",\"单位名称\":\"中铁四局集团建筑工程有限公司资金结算中心\",\"申请日期\":\"2025-08-13\",\"收款方户名\":\"中铁四局集团建筑工程有限公司\",\"收款方账号\":\"3400145860805042376-0007\",\"收款方开户行\":\"中国建设银行合肥市城南支行\",\"付款方户名\":\"中铁四局集团建筑工程有限公司\",\"付款方账号\":\"3400145860805042376-0001\",\"付款方开户行\":\"中国建设银行合肥市城南支行\",\"小写金额\":\"¥67097.79\",\"大写金额\":\"陆万柒仟零玖柒元柒角玖分\"}','2025-08-13 03:27:23',NULL),('4bf67d8e-36eb-4c33-ab97-8bd63be52b91','http://cwxt.ctce.com.cn:9981/api/LoadImage?uid=574c5e50-6ade-4159-bd3c-8ea45254fed3-2025-08-13-02-25-26-2526&signaturetime=1755066445682&signaturedata=2ac9b6a01ab315d2413e78bcda70e0be&appid=10002&fullfilename=6a6f8301-70e6-4fe4-af11-178fb5a18c7b.png','C:\\node\\vlmOcr\\public\\images\\1ed699fe9843329741bdec91a6fc12dc.png','1ed699fe9843329741bdec91a6fc12dc','加过SSHSSRR加本遂和RSSSRS中华([》和国1向收人st)正胃020LE挫发目期;2025年08月1日ahin;SERASALETENEELNBKSHETTITTTTTTTTZYE——二二625081111546736570个人所得税工资薪会所得2025.07.01-2025.07.3116,581.0TCD[|RN»CoFwuk&主人征税专用章SSRERT扫描人:张奥丽，','完税证明','[{\"modelName\":\"完税证明\",\"keyWords\":[\"征税专用\"],\"score\":2}]','{\"标题\":\"中华人民共和国税收完税证明\",\"纳税人名称\":\"中铁四局集团有限公司城市轨道交通工程分公司\",\"纳税人识别号\":\"913400007255331979\",\"填发日期\":\"2025-08-11\",\"税务机关\":\"国家税务总局合肥市包河区税务局第一税务分局（办税服务厅）\",\"合计金额\":\"163647.19\",\"合计金额大写\":\"人民币壹拾叁万陆仟肆佰柒拾圆壹角玖分\",\"填票人\":\"无\",\"备注\":\"无\",\"明细表\":[{\"原凭证号\":\"625081111546736570\",\"税种\":\"个人所得税\",\"品目名称\":\"工资薪金所得\",\"税款所属时期\":\"2025.07.01 - 2025.07.31\",\"入(退)库时间\":\"2025.07.01 - 2025.07.31\",\"实缴(退)金额\":\"143003.84\"},{\"原凭证号\":\"62508111546736570\",\"税种\":\"个人所得税\",\"品目名称\":\"工资薪金所得\",\"税款所属时期\":\"2025.07.01 - 2025.07.31\",\"入(退)库时间\":\"2025.07.01 - 2025.07.31\",\"实缴(退)金额\":\"4062.31\"},{\"原凭证号\":\"62508111546736570\",\"税种\":\"个人所得税\",\"品目名称\":\"工资薪金所得\",\"税款所属时期\":\"2025.07.01 - 2025.07.31\",\"入(退)库时间\":\"2025.07.01 - 2025.07.31\",\"实缴(退)金额\":\"16581.04\"}]}','2025-08-13 06:48:21',NULL),('53102879-6a0f-4772-a9d5-76a8f7179765','http://cwxt.ctce.com.cn:9981/api/LoadImage?uid=abf6aead-ecae-4da0-b8fb-d9583333971f-2025-08-11-02-58-33-5833&signaturetime=1754962479432&signaturedata=4af2ca242a9e7633b6c32a77c7a8ca6f&appid=10002&fullfilename=ef6c4704-298f-440d-b88e-08dc080f9c2e.png','C:\\node\\vlmOcr\\public\\images\\27b8cb9254e538e1f0b513a3154cebde.png','27b8cb9254e538e1f0b513a3154cebde','到Readms:1中华八民放和加税收\\壮。和/证明和人站区直人0十发日期:2025年08月11日KhkSERFEARTRANS-RESN小[TITICTTTTTTETTTEECETEECIII本2|=———:TPRACCITTTITTTIR中向本全AN本0SR税务机关Er出it一要善保党AENBTS','完税证明','[{\"modelName\":\"完税证明\",\"keyWords\":[\"税务机关\",\"税收\"],\"score\":4}]','{\"标题\":\"中华人民共和国税收完税证明\",\"纳税人名称\":\"中铁四局集团有限公司第八工程分公司\",\"纳税人识别号\":\"913400007110065057\",\"填发日期\":\"2025年08月11日\",\"税务机关\":\"国家税务总局铁力市税务局第一税务分局（办税服务厅）\",\"合计金额\":\"4754.68\",\"合计金额大写\":\"人民币肆仟柒佰伍拾肆圆陆角捌分\",\"填票人\":\"\",\"备注\":\"证件号码: 税款所属税务机关名称: 国家税务总局铁力市税务局\",\"明细表\":[{\"原凭证号\":\"6250811111549546315\",\"税种\":\"个人所得税\",\"品目名称\":\"工资薪金所得\",\"税款所属时期\":\"2025.07.01 - 2025.07.31\",\"入(退)库时间\":\"\",\"实缴(退)金额\":\"3251.12\"},{\"原凭证号\":\"6250811111549546315\",\"税种\":\"个人所得税\",\"品目名称\":\"工资薪金所得\",\"税款所属时期\":\"2025.07.01 - 2025.07.31\",\"入(退)库时间\":\"\",\"实缴(退)金额\":\"1503.56\"}]}','2025-08-13 06:59:40',NULL),('587bd07d-2360-49f8-a721-1d039ea125e0','http://cwxt.ctce.com.cn:9981/api/LoadImage?uid=b845174b-cc1d-4643-b5fd-f6b09d0182ac-2025-08-13-09-43-16-4316&signaturetime=1755049721964&signaturedata=bbae35cf2a5fdb13baf15e4ecc7456e4&appid=10002&fullfilename=725a57a0-5fb1-4253-926b-70d0ca444d60.jpg','C:\\node\\vlmOcr\\public\\images\\86a2eb19ee4a80eb5973e2e8c0e735e9.jpg','86a2eb19ee4a80eb5973e2e8c0e735e9','允农民工工资支付单分包方名称〈全称):安徽中构建筑工程有限公司工资所属月份，2025年6月金额:元[BT人[90[RCITwwsTH|%5[%n]EECOREIINIETTITTRDLSSgy||四EECETZ29|||”而一|人，分包方负责人签字;3元对妆也分包方名称《著星让K)yy§%','农名工工资单','[{\"modelName\":\"农名工工资单\",\"keyWords\":[\"工资所属\",\"分包方名称\",\"工资支付单\"],\"score\":10}]','{\"标题\":\"农民工工资支付单\",\"分包方名称\":\"安徽中构建筑工程有限公司\",\"工资所属月份\":\"2025年6月\",\"合计本月实付\":\"16100.00\",\"合计人数\":\"2人\",\"明细表\":[{\"序号\":1,\"姓名\":\"李平先\",\"身份证号\":\"533524198512180318\",\"本月实付\":\"6800.00\",\"银行账号\":\"6217003520017184878\",\"开户行\":\"中国建设银行股份有限公司三亚河西支行\",\"签名\":\"李平先\",\"备注\":\"\"},{\"序号\":2,\"姓名\":\"杨仁秋\",\"身份证号\":\"533524198611063387\",\"本月实付\":\"9300.00\",\"银行账号\":\"6217003520017184860\",\"开户行\":\"中国建设银行股份有限公司三亚河西支行\",\"签名\":\"杨仁秋\",\"备注\":\"\"},{\"序号\":3,\"姓名\":\"合计\",\"身份证号\":\"2人\",\"本月实付\":\"16100.00\",\"银行账号\":\"\",\"开户行\":\"\",\"签名\":\"\",\"备注\":\"\"}]}','2025-08-13 02:23:40',NULL),('5ae4722e-b71a-4fe5-a8ba-9e4faed6ab63','http://cwxt.ctce.com.cn:9981/api/LoadImage?uid=ddad1115-24cf-472a-85d4-8099270d6492-2025-08-07-01-11-12-1112&signaturetime=1754544673573&signaturedata=86557745a1b62c30cf49e5733ae2fac&appid=10002&fullfilename=adcbc0fa-9646-458d-ac32-4d18f53002ba.jpg','F:\\CEISHI\\node\\vlmOcr\\public\\images\\e57ea27ab034335b3ce96c86eb7782b1.jpg','e57ea27ab034335b3ce96c86eb7782b1','农民工工资支付单分包方名称〈全称):连云港华磊吊装有限公司工资所属月份，2025年06月金额:元加ICE[|om|aaam|rr||分包方负责人签字Hhy,二/ORIHN\\分包方名称GEEhy和和学划NEpg9灼MA\\扫描人:张二','农名工工资单','[{\"modelName\":\"农名工工资单\",\"keyWords\":[\"工资支付单\",\"分包方名称\",\"工资所属\"],\"score\":10}]','{\"subcontractorName\":\"连云港华磊吊装有限公司\",\"salaryMonth\":\"2025年06月\",\"employees\":[{\"sequence\":1,\"name\":\"杨孝勇\",\"idCardNumber\":\"522425199907244518\",\"actualPayment\":10000,\"bankAccount\":\"6217001540033275023\",\"bankBranch\":\"中国建设银行\",\"signature\":\"杨孝勇\"}],\"totalPeople\":\"1人\",\"totalAmount\":10000}','2025-08-07 08:59:45',NULL),('8caf4d72-e94f-4a17-b026-d3ef0a1c6fd7','http://cwxt.ctce.com.cn:9981/api/LoadImage?uid=cc0687e9-4151-4d40-bdf7-713f74457fe0-2025-08-13-10-45-32-4532&signaturetime=1755053756432&signaturedata=3d4974ba70638964711d9684fd8cf8a5&appid=10002&fullfilename=8dd147eb-4a86-40e3-900d-d6b8a5a2c1b1.jpg','C:\\node\\vlmOcr\\public\\images\\5638ab71fec45af121b8f12b7ca7cc47.jpg','5638ab71fec45af121b8f12b7ca7cc47','中铁四局集团有限公司第一工程分公司老河口呐博啤酒产业园〈一期)建设项目EPC总承包项目经理部2025年8月〈第8期)劳务验工计价表上期末开累金额:7730520.33元本次结算金额:25921.24元开累结算金额:7756441.57元上期末开累税额:695746.83元本次税额:2332.91元开累税额:698079.74元上期末价税合价:8426267.16元本次价税合价:28254.15元开累价税合价;元>Sd[六-Zn人it项目书记:项目iSy加|2劳务单位负责,_€)\\日期;六日过4已£s=b,.YOXBG15:RBe多包N局N45>第1页共8页扫描人:郑凤','劳务验工计价表','[{\"modelName\":\"劳务验工计价表\",\"keyWords\":[\"验工计价\",\"劳务验工\",\"价税合价\",\"劳务单位\",\"项目经理\",\"项目书记\"],\"score\":17}]','{\"项目经理部名称\":\"中铁四局集团有限公司第一工程分公司老河口呐博啤酒产业园（一期）建设项目EPC总承包项目经理部\",\"日期\":\"2025年8月（第8期）\",\"表格名称\":\"劳务验工计价表\",\"上期末开累金额\":7730520.33,\"本次结算金额\":25921.24,\"开累结算金额\":7756441.57,\"上期末开累税额\":695746.83,\"本次税额\":2332.91,\"开累税额\":698079.74,\"上期末价税合价\":8426267.16,\"本次价税合价\":28254.15,\"开累价税合价\":8451981.81,\"劳务单位名称\":\"湖北古璟建设工程有限公司\",\"项目书记日期\":\"2025.8.13\",\"项目经理日期\":\"2025.8.13\",\"扫描人\":\"郑凤\"}','2025-08-13 03:02:55',NULL),('cae94ad1-afd9-41f3-a9a5-84ab8e79f2a8','http://cwxt.ctce.com.cn:9981/api/LoadImage?uid=2a3b8389-5b02-45b4-acd5-208d8a10ad34-2025-08-13-10-51-01-511&signaturetime=1755053736917&signaturedata=adb83f8d79f71b1ccf57e50469641f&appid=10002&fullfilename=a6598489-49e3-4715-b779-e7f7baabb70b.jpg','C:\\node\\vlmOcr\\public\\images\\b523f146a1fbe7b804c84d7dac3d8795.jpg','b523f146a1fbe7b804c84d7dac3d8795','-中铁财务有限责任公司收款通知音司币种:人民币2025年08月11HN0.15-353-76784962-849603791||中铁四局三公司社保中心〈活期户)|2付|下人成|元|中铁财务有限责任公司区阳东农村商业银行股份有限公司曾东支行位回本二REREAT人预缴2025年8月二公司27人社保费中铁财务有限贡任公司2025081|/各注转记章制单:机核NE复核:机核','银行回单','[{\"modelName\":\"银行回单\",\"keyWords\":[\"币种\",\"收款通知\",\"中铁财务\",\"银行\"],\"score\":8}]','{\"标题\":\"收款通知单\",\"收款方户名\":\"中铁四局二公司社保中心（活期户）\",\"收款方账号\":\"20110101924010440001\",\"收款方开户行\":\"中铁财务有限公司\",\"付款方户名\":\"中铁阜阳医院\",\"付款方账号\":\"2000057508051030000034\",\"付款方开户行\":\"阜阳颍东农村商业银行股份有限公司闸东支行\",\"金额\":\"147197.5\",\"大写金额\":\"壹拾肆万柒仟壹佰玖柦元肆角伍分\",\"手续费\":\"\",\"交易日期\":\"2025年08月11日\",\"备注\":\"\",\"收费时段\":\"\"}','2025-08-13 03:13:32',NULL),('e4444135-ce94-46e1-9b48-7a2bfae14a2c','http://cwxt.ctce.com.cn:9981/api/LoadImage?uid=78d773b1-416e-4cd1-84ff-83f207781ee7-2025-08-12-11-17-37-1737&signaturetime=1755053710417&signaturedata=d6be5561348863e4c253d927c56dfc0&appid=10002&fullfilename=ba0a21a7-5a2f-47ff-8b60-135bdd5ec29a.jpg','C:\\node\\vlmOcr\\public\\images\\82112443f98871ace6f3400ddd1b3cdb.jpg','82112443f98871ace6f3400ddd1b3cdb','徽州路快速化工程项目经理部单位食堂核算表单位:徽州路项目期间，2025年7月岂Te|区sw||ao|[jssw|woTaow|[wwssr|rev|am[ws|ao[we||ERICEEC[wsewwTe|[sfomwommzen|5[awwasenwwe|[wmwm|CE|[as|em|[aeTewe加ETTZZTCIIREeeTe|四TXT到天生ur|wwem|wew[wzraemas|weww|[anaom|和|sw|单位负责人，P务审核人，ARA办公室，|人QUL纪规员，ASNY人会，,银1扫描人:周佳胜','食堂核算表','[{\"modelName\":\"劳务验工计价表\",\"keyWords\":[\"项目经理\"],\"score\":2},{\"modelName\":\"食堂核算表\",\"keyWords\":[\"食堂核算\"],\"score\":6}]','{\"截止上月盘点库存金额\":0,\"本月食堂采购支出\":23240,\"本月食堂收入\":23240,\"个人扣款合计\":3320,\"个人扣款（合同制在岗职工）\":2700,\"个人扣款（劳务派遣人员）\":0,\"个人扣款（施工劳务企业人员）\":620,\"个人扣款（列转内部单位）\":0,\"个人扣款（外来人员参照职工标准）\":0,\"个人交款（外来人员）\":0,\"工作餐\":0,\"小餐厅招待\":0,\"单位补贴合计\":19920,\"单位补贴（合同制在岗职工）\":16200,\"单位补贴（劳务派遣人员）\":0,\"单位补贴（施工劳务企业人员）\":3720,\"单位补贴（列转内部单位）\":0,\"单位补贴（外来人员参照职工标准）\":0,\"内部就餐合计人天数\":332,\"人均每天扣款/交款\":10,\"人均每天补贴(备注: 项目不设食堂)\":60,\"截止本月盘点库存金额\":0}','2025-08-13 03:18:48',NULL),('f8331bc0-6316-40ea-b9da-9a97130118ec','http://cwxt.ctce.com.cn:9981/api/LoadImage?uid=0ee82c26-c3c9-473e-a650-dfe20dbf5fd7-2025-08-12-09-15-21-1521&signaturetime=1755048737120&signaturedata=e1a9efbfd2b8e91a4deec1a839632c26&appid=10002&fullfilename=60387678-c41a-47c7-a9b8-22f1a08d5324.jpg','C:\\node\\vlmOcr\\public\\images\\3b1128d288c74477849f19e8053fb433.jpg','3b1128d288c74477849f19e8053fb433','本BE农民工工资支付单分包方名称〈全称):安徽叶森基建工程有限公司工资所届月份:2025年4月金额:元=[Teawes[kindwees[THTe|IECEEIIIEITIRETTTTRAAUL关于EEC=|全IE和|国国[|ooao|SPE|Co|wex[ommmoronon|owo|cnvomorn[FERTRERTIOGRITRES]_ggugg|IE了，EEC生育:7二加于EECTIEIIEIIWEIITITETT0国国-er2iEEC二LU全国有中年路支行RAYEECIIIOIEIIEIORIITITIEEYIS:各国加SRTTEEPET—EEITHER生国EECEEIIIIOIEIIENRETNIUSUO人，国国:EECEIIIOIEIIEIITETIIITTSEUSee||旺|二本To的分包方负责人签字:¥.党，从|0<qg4军本分包方名称(疼章)|e区3二全次的全a>CeeaESee必人本RES2”SEshwEMRR::和Ra扫描人:罗胞人','农名工工资单','[{\"modelName\":\"农名工工资单\",\"keyWords\":[\"工资支付单\",\"分包方名称\"],\"score\":8}]','{\"标题\":\"农民工工资支付单\",\"分包方名称\":\"安徽叶森基建工程有限公司\",\"工资所属月份\":\"2025年4月\",\"合计本月实付\":\"626578.00\",\"合计人数\":\"73人\",\"明细表\":[{\"序号\":61,\"姓名\":\"吴运财\",\"身份证号\":\"350128198806270914\",\"本月实付\":\"15000.00\",\"银行账号\":\"62284800068878625778\",\"开户行\":\"中国农业银行股份有限公司福清宏路支行\",\"签名\":\"吴运财\",\"备注\":\"\"},{\"序号\":62,\"姓名\":\"吴兆川\",\"身份证号\":\"429003197512234212\",\"本月实付\":\"11000.00\",\"银行账号\":\"622848075979735278\",\"开户行\":\"中国农业银行股份有限公司枣阳吴店支行\",\"签名\":\"吴兆川\",\"备注\":\"\"},{\"序号\":63,\"姓名\":\"徐普华\",\"身份证号\":\"612328198404064612\",\"本月实付\":\"9870.00\",\"银行账号\":\"6217997900040289316\",\"开户行\":\"中国邮政储蓄银行股份有限公司镇巴县支行\",\"签名\":\"徐普华\",\"备注\":\"\"},{\"序号\":64,\"姓名\":\"徐荣发\",\"身份证号\":\"612328197004194632\",\"本月实付\":\"6732.00\",\"银行账号\":\"621700006600132821\",\"开户行\":\"中国建设银行股份有限公司滨海支行\",\"签名\":\"徐荣发\",\"备注\":\"\"},{\"序号\":65,\"姓名\":\"杨春美\",\"身份证号\":\"61232819780130462X\",\"本月实付\":\"6360.00\",\"银行账号\":\"6221807900013293511\",\"开户行\":\"中国邮政储蓄银行股份有限公司镇巴县支行\",\"签名\":\"杨春美\",\"备注\":\"\"},{\"序号\":66,\"姓名\":\"赵国民\",\"身份证号\":\"410523196705151016\",\"本月实付\":\"9625.00\",\"银行账号\":\"6215340301403925091\",\"开户行\":\"中国建设银行股份有限公司汤阴光明路支行\",\"签名\":\"赵国民\",\"备注\":\"\"},{\"序号\":67,\"姓名\":\"赵新民\",\"身份证号\":\"410523197203201030\",\"本月实付\":\"9870.00\",\"银行账号\":\"621700246003107181\",\"开户行\":\"中国建设银行汤阴支行\",\"签名\":\"赵新民\",\"备注\":\"\"},{\"序号\":68,\"姓名\":\"钟洪波\",\"身份证号\":\"512921197612120498\",\"本月实付\":\"10500.00\",\"银行账号\":\"6217903100017886219\",\"开户行\":\"中国银行南充龙门支行\",\"签名\":\"钟洪波\",\"备注\":\"\"},{\"序号\":69,\"姓名\":\"周代华\",\"身份证号\":\"612328197907034613\",\"本月实付\":\"8120.00\",\"银行账号\":\"6217004530012393092\",\"开户行\":\"中国建设银行股份有限公司乌鲁木齐青年路支行\",\"签名\":\"周代华\",\"备注\":\"\"},{\"序号\":70,\"姓名\":\"周义军\",\"身份证号\":\"340121198012048215\",\"本月实付\":\"8000.00\",\"银行账号\":\"621785630003537177\",\"开户行\":\"中国银行股份有限公司长丰支行\",\"签名\":\"周义军\",\"备注\":\"\"},{\"序号\":71,\"姓名\":\"周治坤\",\"身份证号\":\"513030196801197113\",\"本月实付\":\"8500.00\",\"银行账号\":\"6228450470018942715\",\"开户行\":\"中国农业银行股份有限公司重庆大渡口九宫庙支行\",\"签名\":\"周江坤\",\"备注\":\"\"},{\"序号\":72,\"姓名\":\"朱安成\",\"身份证号\":\"532101198511053213\",\"本月实付\":\"16000.00\",\"银行账号\":\"6228480395643797677\",\"开户行\":\"中国农业银行股份有限公司南京宁南支行\",\"签名\":\"朱安成\",\"备注\":\"\"},{\"序号\":73,\"姓名\":\"宗宏春\",\"身份证号\":\"532927199001120334\",\"本月实付\":\"2970.00\",\"银行账号\":\"6231900000264465652\",\"开户行\":\"云南巍山农村商业银行股份有限公司\",\"签名\":\"宗宏春\",\"备注\":\"\"}]}','2025-08-13 02:26:06',NULL);
/*!40000 ALTER TABLE `img_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `model_keywords`
--

DROP TABLE IF EXISTS `model_keywords`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `model_keywords` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `model_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `keyword_text` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `keyword_index` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_model_id` (`model_id`),
  KEY `idx_model_keywords_keyword_text` (`keyword_text`),
  CONSTRAINT `fk_model_keywords_model` FOREIGN KEY (`model_id`) REFERENCES `models` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `model_keywords`
--

LOCK TABLES `model_keywords` WRITE;
/*!40000 ALTER TABLE `model_keywords` DISABLE KEYS */;
INSERT INTO `model_keywords` VALUES (20,'1754556585395','本月实付',2),(21,'1754556585395','工资所属',2),(22,'1754556585395','分包方名称',2),(23,'1754556585395','工资支付单',6),(24,'1754556585395','农名工',2),(31,'1755054111983','项目书记',2),(32,'1755054111983','项目经理',2),(33,'1755054111983','劳务单位',2),(34,'1755054111983','价税合价',3),(35,'1755054111983','劳务验工',4),(36,'1755054111983','验工计价',4),(53,'1755054485678','回单',2),(54,'1755054485678','银行',2),(55,'1755054485678','中铁财务',2),(56,'1755054485678','收款通知',2),(57,'1755054485678','币种',2),(58,'1755054485678','利息',2),(59,'1755054485678','手续费',2),(60,'1755054485678','付款',2),(61,'1755055085813','食堂核算',6),(62,'1755055085813','食堂采购',2),(63,'1755055085813','食堂收入',2),(64,'1755055085813','个人扣款',2),(65,'1755055085813','单位补贴',2),(66,'1755055085813','小餐厅',2),(67,'1755055085813','工作餐',2),(68,'1755055085813','盘点库存',2),(84,'1755055406311','收款',2),(85,'1755055406311','付款',2),(86,'1755055406311','调户金额',3),(87,'1755055406311','调户申请',4),(88,'1755055406311','银行调户',6),(89,'1755055406311','申请日期',2),(90,'1755067485679','完税证明',6),(91,'1755067485679','税收',2),(92,'1755067485679','征税专用',2),(93,'1755067485679','税务机关',2),(94,'1755067485679','税务局',2),(95,'1755067485679','税务分局',2),(96,'1755067485679','税款',2),(97,'1755067485679','税种',2),(98,'1755067485679','纳税人',2);
/*!40000 ALTER TABLE `model_keywords` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `models`
--

DROP TABLE IF EXISTS `models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `models` (
  `id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `modelName` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `description` text COLLATE utf8_unicode_ci,
  `glmTips` text COLLATE utf8_unicode_ci,
  `moreApi` text COLLATE utf8_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `models`
--

LOCK TABLES `models` WRITE;
/*!40000 ALTER TABLE `models` DISABLE KEYS */;
INSERT INTO `models` VALUES ('1754556585395','农名工工资单','农名工工资单','这是一个农名工工资单，请提取结构化数据，以json格式返回。合计本月实付、合计人数字段不一定存在，如果没有，返回空字符即可。明细表中需要剔除合计行。数据格式：{标题，分包方名称，工资所属月份，合计本月实付，合计人数，明细表：[{序号，姓名，身份证号，本月实付，银行账号，开户行，签名，备注}]}','GLM-4.1V-Thinking-Flash','2025-08-07 08:49:48',NULL),('1755054111983','劳务验工计价表','劳务验工计价表','这是一个劳务验工计价表，请提取结构化数据，以json格式返回。','GLM-4.1V-Thinking-Flash','2025-08-13 03:01:55',NULL),('1755054485678','银行回单','银行回单','这是一个银行回单，请提取结构化数据，以json格式返回。银行回单样式繁多，请根据实际情况对应标准字段后返回。利息回单可能只有收款方信息，手续费可能只有付款方信息，没有的字段返回空字符即可。数据格式：{标题，收款方户名，收款方账号，收款方开户行，付款方户名，付款方账号，付款方开户行，金额，大写金额，手续费，交易日期，备注，收费时段}','GLM-4.1V-Thinking-Flash','2025-08-13 03:08:09',NULL),('1755055085813','食堂核算表','食堂核算表','这是一个食堂核算表，第二列为key，第四列为value，请提取结构化数据，以json格式返回。','GLM-4.1V-Thinking-Flash','2025-08-13 03:18:09',NULL),('1755055406311','银行调户申请单','银行调户申请单','这是一个银行调户申请单，请提取结构化数据，以json格式返回。数据格式：{标题，单位名称，申请日期，收款方户名，收款方账号，收款方开户行，付款方户名，付款方账号，付款方开户行，小写金额，大写金额}','GLM-4.1V-Thinking-Flash','2025-08-13 03:23:29',NULL),('1755067485679','完税证明','完税证明','这是一个完税证明，请提取结构化数据，以json格式返回。数据格式：{标题，纳税人名称，纳税人识别号，填发日期，税务机关，合计金额，合计金额大写，填票人，备注，明细表：[{原凭证号，税种，品目名称，税款所属时期，入(退)库时间，实缴(退)金额}]}','GLM-4.1V-Thinking-Flash','2025-08-13 06:44:49',NULL);
/*!40000 ALTER TABLE `models` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2b$10$X6KaDTDeewaTmkczXeGps.bTT9mQHSKgvXjFjxvO/9I/3Y4kTzFve','admin@example.com','2025-08-07 08:47:57',NULL),(2,'rpa','$2b$10$TYNSe.qf3VRd0yuhB62EX.mxRoZ0neEcY.z3uE1AWc6kSF5KA/Rju','rpa@rpa.com','2025-08-07 09:02:22',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'myocr'
--

--
-- Dumping routines for database 'myocr'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-13 15:00:44
