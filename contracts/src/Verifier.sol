// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is generated with [snarkJS](https://github.com/iden3/snarkjs).

    snarkJS is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    snarkJS is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with snarkJS. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.7.0 <0.9.0;

contract Groth16Verifier {
    // Scalar field size
    uint256 constant r    = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 20491192805390485299153009773594534940189261866228447918068658471970481763042;
    uint256 constant alphay  = 9383485363053290200918347156157836566562967994039712273449902621266178545958;
    uint256 constant betax1  = 4252822878758300859123897981450591353533073413197771768651442665752259397132;
    uint256 constant betax2  = 6375614351688725206403948262868962793625744043794305715222011528459656738731;
    uint256 constant betay1  = 21847035105528745403288232691147584728191162732299865338377159692350059136679;
    uint256 constant betay2  = 10505242626370262277552901082094356697409835680220590971873171140371331206856;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 6569751711327777825755163726335813141579197066240086447295767835469461366899;
    uint256 constant deltax2 = 589926537204845491965248986401654895344496940757821540119352876509495883559;
    uint256 constant deltay1 = 8966982881069478654211076230168954928236662832997412111485847776430439695816;
    uint256 constant deltay2 = 4312655557283335062424783538163640411000914744404621587127178744307207562315;

    
    uint256 constant IC0x = 20868490912609153051927689367545875109044972229075655297682691539804609907298;
    uint256 constant IC0y = 9383313096610531992079187937388524857838241634911787891558943720716551065916;
    
    uint256 constant IC1x = 9471642795547064113889015107848898148104594796625049117820918429231292711991;
    uint256 constant IC1y = 10371826500912160776786194257496408972758596362956210215157236127669165573190;
    
    uint256 constant IC2x = 18283196220881841621261430548139468582836343232198322829321995543923082028272;
    uint256 constant IC2y = 8691611271782508136150285474649350495283976612515583865873741973154782161413;
    
    uint256 constant IC3x = 1926310580473611731042173296528253978768527290700247436601893316490303174441;
    uint256 constant IC3y = 12920012199486281765974844604947136620118202168701923431628124241823045793419;
    
    uint256 constant IC4x = 7644018231677822951353467170645587684243930584351185948480491147449795753489;
    uint256 constant IC4y = 15173580768142655610652842975074810220445855831350329198109090753739266239099;
    
    uint256 constant IC5x = 18110638935472555001996252491587925928466996791997023719580218052534115627597;
    uint256 constant IC5y = 13336566583165891026620782966114681034958460986050106240744483330738852414857;
    
    uint256 constant IC6x = 17859322950274707692977378913813291846223750798617246839670600512418731046107;
    uint256 constant IC6y = 6410160434141935230089779422180548772053894772132309681111320048430425087049;
    
    uint256 constant IC7x = 14812652668368861719967052834185387295789881110663988746636341808203399653729;
    uint256 constant IC7y = 1500671380326860158328565070003443378165667552010588943301507564772292077407;
    
    uint256 constant IC8x = 14685520798149023556017967678814065139109426792259574023271849863598918998335;
    uint256 constant IC8y = 12531934293170963649725747731141215204206681602068551821049885390253956897423;
    
    uint256 constant IC9x = 1366263645222955829676537044526827646427911993812505954797424992352532039265;
    uint256 constant IC9y = 2480959602892365086283977306935556104156299625668588067806898741273996249176;
    
    uint256 constant IC10x = 2698667055526781139824404547073359383652298010571291281741913065477259860767;
    uint256 constant IC10y = 8699229704950025748133328487886452529045305785222145864059259129388084815314;
    
    uint256 constant IC11x = 7187568584578346367807380350016684651742075446017267658481757625581005058085;
    uint256 constant IC11y = 7217817948062570583159409252121599158956675262344988595532041862747287727854;
    
    uint256 constant IC12x = 10087572321010594163831536156294515154203673245266179272707837418083010746692;
    uint256 constant IC12y = 10550070562855098694600129559724963959163387662754469922481842367004487205104;
    
    uint256 constant IC13x = 15359181442381015524135361929603589137028386479559907682062416864017958113539;
    uint256 constant IC13y = 2233939227776309716066434540084981228207141441320703753625299833311479598689;
    
    uint256 constant IC14x = 2366834535696244071975468504308488154828009139447452785674522124801285177085;
    uint256 constant IC14y = 9347623506318124791458691729080002683755199632077326850634732085046500098358;
    
    uint256 constant IC15x = 17946298229278504863286207947482709162546296683531727659727639949272428077425;
    uint256 constant IC15y = 18406409306421172787702217931639341139106394002733687870056630182923045070576;
    
    uint256 constant IC16x = 10236929667158525266196153913151172872299843216130354456340047822703749247215;
    uint256 constant IC16y = 13985215648669643788680685438097657503279643772810659304433555735425635982161;
    
    uint256 constant IC17x = 5712595855797488482271971351124847776891257357235667364414607848209895667132;
    uint256 constant IC17y = 10600644678813651509942065138241293899320111581551385328851677658055005316931;
    
    uint256 constant IC18x = 2669210111456517851320159725731174435172440668333422291181931984638585241393;
    uint256 constant IC18y = 5888024760990296247901519435669635189148400275800740200029753116608194849630;
    
    uint256 constant IC19x = 17068810704526112229441328434741482915127843339996560079902674360910907945112;
    uint256 constant IC19y = 3004906850043392014716082032330281073552402306849236134626370836818917673348;
    
    uint256 constant IC20x = 19369658970879731478205030094262495601562263242949737238955094927796390956477;
    uint256 constant IC20y = 20308151621020651945143059483823218052542455280348695171996604105495952125933;
    
    uint256 constant IC21x = 1315316289889719858836442467456172577619728694130249605560815194228987861480;
    uint256 constant IC21y = 20442858589755005167182466843601385854342743616464955137670850444539626555644;
    
    uint256 constant IC22x = 20183574097838433045170231347379800179585435404357197912430025450348589336627;
    uint256 constant IC22y = 17188506774881441771610396058548271687154183497142842541866901717661039535121;
    
    uint256 constant IC23x = 3352470652116291881323808491989976075833834421964316233331257421940100786899;
    uint256 constant IC23y = 13733371511785725538241996437968742688056913905702005984924533746393392425776;
    
    uint256 constant IC24x = 9604842741990270090999260754841111063931691989080474485087361657714959889445;
    uint256 constant IC24y = 11074909224292104904450349826420851929729396563182308856621490026274777654681;
    
    uint256 constant IC25x = 9684271338668674197984097335676506859489762948150399938884439024581562982163;
    uint256 constant IC25y = 5228823656778653045199120049791998033478968193604948481443807154864058141798;
    
    uint256 constant IC26x = 20871785287020523190565884455598372003467049888390691083261095240873577917361;
    uint256 constant IC26y = 5699965058573921393776556550515338573658170775658113544457935830415232790821;
    
    uint256 constant IC27x = 9630936202788165567080090592122052848997579451782118636044279640737384942811;
    uint256 constant IC27y = 21596736906395778574062836241276484131753190711240199086819027415617843947717;
    
    uint256 constant IC28x = 7136977043683500162742418286054579258365155207543549029794731101582866957458;
    uint256 constant IC28y = 2004928436804461132185170354806358449098152388660134755298117732150188398494;
    
    uint256 constant IC29x = 14122940733713084286738581608233669140404533008303556394591266095273480069624;
    uint256 constant IC29y = 11458494641437695368976255875632058071977116682608754085169597928123650158739;
    
    uint256 constant IC30x = 7911295126308072760029699861469394931387376362358761683692256573609052785743;
    uint256 constant IC30y = 12370695597043848072142131432871092932344747708424296581806451123663590066471;
    
    uint256 constant IC31x = 16037642120399400968575669851723487044139804523132567335299481605285919665307;
    uint256 constant IC31y = 8488091406865915433981582311718025247133507987241895429866663280277490812255;
    
    uint256 constant IC32x = 16547097414292624567097739838202145277485549518813224283547324080158416475831;
    uint256 constant IC32y = 8199950691898214982960890326192968751443011895292966048167149594732613425127;
    
    uint256 constant IC33x = 17102773487611837843154521971980398763712803126268428040432687967347670934883;
    uint256 constant IC33y = 6866449051442717268510498649736708058496367262402548925937860777422660120061;
    
    uint256 constant IC34x = 19984519594004471365997832780876405194570019890247591800829865468910220142304;
    uint256 constant IC34y = 14639223082372763768637581786972050621185886654105199362430227228344370705142;
    
    uint256 constant IC35x = 1272938962036341056839660737572834968429169274549799829249693383514119932742;
    uint256 constant IC35y = 17471430021996798229802831098843030423413384680962099383363481306096564949479;
    
    uint256 constant IC36x = 1174850602401287437578139541974734089568841226618409742232971191104101596194;
    uint256 constant IC36y = 12923557358186078074535249825079271419438520067250244725896631596229583557313;
    
    uint256 constant IC37x = 4707241935101302333803388995830435533250779870564495611674325016692166090770;
    uint256 constant IC37y = 6409913749321390627751269362673607193010927588324332906511762212056490562192;
    
    uint256 constant IC38x = 4499026803167705770419660073899321855399568878956040210776502749123488732704;
    uint256 constant IC38y = 13745643966674326748530836174884851270832499129551370643417726700835754381832;
    
    uint256 constant IC39x = 101152335332441924763819846971971210005427402995252285726858291630869566844;
    uint256 constant IC39y = 19044051680531548041543621525280749621977760149017313516250068714634131225748;
    
    uint256 constant IC40x = 7826388821233549475539527298715280488400767520448543548100400420435896406786;
    uint256 constant IC40y = 18031364255741579927711410331768837416433226094506065563635404579440855753106;
    
    uint256 constant IC41x = 16411726598998207356823022880769393069393149011883604646510284179999644827581;
    uint256 constant IC41y = 13624453090055476023378124511181000809002616146311648866209975657700641663452;
    
    uint256 constant IC42x = 16001032691196667220898270998930061756851225021270139259862663812499228020023;
    uint256 constant IC42y = 11282521368373614388516918155810456771599603557707099263931081437895740070828;
    
    uint256 constant IC43x = 1976863489248374647617707830231591423026570697525772494823679118911509109732;
    uint256 constant IC43y = 5300756959372103185310027879622732954487920693074522605490226450330015584001;
    
    uint256 constant IC44x = 13537659025942892591200698202962090569633650400221280141583331194309766455153;
    uint256 constant IC44y = 13846458235117262862663005767410479827925116246233483693118326365455743499362;
    
    uint256 constant IC45x = 1987017472524633343962846668522527959041320512020890010560795139516225063341;
    uint256 constant IC45y = 4359469181094173827469614742708354983706774659473132469511573764203206696905;
    
    uint256 constant IC46x = 2165821953284340876870376364176106453945996246835446223767061466573468945282;
    uint256 constant IC46y = 4868998614460620808601813747363984445302518713303478593065860822911610383067;
    
    uint256 constant IC47x = 3186236765541361891393611119681198410271615975255548150216006763672166529327;
    uint256 constant IC47y = 18094681481402815686822172898447345000588441354420716341234520166271241144912;
    
    uint256 constant IC48x = 6128206303250109546874394854892980792997704112691178987508029853118196113996;
    uint256 constant IC48y = 21093569031335389201377291387530845039440922005873105216817669124181711121311;
    
    uint256 constant IC49x = 11134354552911812023252954639381327523984770529435197116912931530335100647012;
    uint256 constant IC49y = 16198081862989790815918460148244075234920698762879302479478434595631957419954;
    
    uint256 constant IC50x = 8710854900157520075840356125775692319872176909003594712704977129431499957798;
    uint256 constant IC50y = 9834646405483708376261265979941347749270539258949719243485685809983489857128;
    
    uint256 constant IC51x = 5798938196822110992838670571719810983844154170788432507182335532848378886704;
    uint256 constant IC51y = 947197006423673242049727059348551064380056626050029152392787665958033872692;
    
    uint256 constant IC52x = 4173251844987831215433718703724917758718925280956272130830108577147167665878;
    uint256 constant IC52y = 18153749955332412183598589264886002602097271070791554969991545888671164095291;
    
    uint256 constant IC53x = 17692738982190204907668617300695102192938541096475353651479312902522985142336;
    uint256 constant IC53y = 20606408815750480995785475340293492409276648361939435500022285219843442568346;
    
    uint256 constant IC54x = 19018581698914635076894276978797800477517675349048300023162329198754464799788;
    uint256 constant IC54y = 13549546504781796334592032356067221545933610154869640161250583381318418868619;
    
    uint256 constant IC55x = 571386859986337072692373096349570238710272637546101481790463689402865796203;
    uint256 constant IC55y = 2281881198585718191429353608944848356294721844384426166202599427451835471878;
    
    uint256 constant IC56x = 2208898313432114036519789640836473901058945521517988323484984634818535543158;
    uint256 constant IC56y = 9980371772713905455062820149534014323310769540610179218131269563571524042824;
    
    uint256 constant IC57x = 12823119630627406937044569186027875844071178936719793955510383330657808533867;
    uint256 constant IC57y = 7844755701324595771668451905940078117164372703009895860234856297696117786816;
    
    uint256 constant IC58x = 15913296930679287966365923885408673422670473670393658786576359127129018587154;
    uint256 constant IC58y = 8860073080549251083042145980296991059664005270209779268388028141411943812136;
    
    uint256 constant IC59x = 9947354275229455108274635486699500398377575796326207397695499709850816549601;
    uint256 constant IC59y = 504804592902407858646143812152859691595628940541297057867631776026994573311;
    
    uint256 constant IC60x = 3525096775935460193812050843805203246264758896153872106234207369954422456297;
    uint256 constant IC60y = 5151104218810233789681873668485229814038686661604142420355057321226553804339;
    
    uint256 constant IC61x = 5913488591529120536791686631693014697312538465499905061427813866121488896268;
    uint256 constant IC61y = 13621487432383599382705431149380045693017076138528632274359392497159361000678;
    
    uint256 constant IC62x = 1786781955963907034833760495544236420604547334621579871832782552820446336714;
    uint256 constant IC62y = 4311274297138685870463380328372931331242157399343764935865591425911763963020;
    
    uint256 constant IC63x = 5653340571125328153600438302507006178517615660283145067342709673105359755453;
    uint256 constant IC63y = 3527948108608529575482595122906175132922222193489325965102012957012960335512;
    
    uint256 constant IC64x = 11579649150897326206317633002046146031467441049747703730998690134953194782649;
    uint256 constant IC64y = 19451665903500034177020404246952398887964050844428635719723131818630329851345;
    
    uint256 constant IC65x = 13449077349176569509164862212747327937810606979113503631739201300518751306734;
    uint256 constant IC65y = 2171538886771530060892241411020148000837045337323069279062179880921313607428;
    
    uint256 constant IC66x = 7943514509508317492792212123106124817831487041579694616719515247427460837814;
    uint256 constant IC66y = 9881105138052139694986403735582266913153071127172049396900963129403529632643;
    
    uint256 constant IC67x = 17801999087096137864051023668867706793870061638262912499698111126161152864848;
    uint256 constant IC67y = 16717291196628146570915952950113575842414279929754862504637613263481115991573;
    
    uint256 constant IC68x = 11775868523561437213028930559421608959838579227241080523374778431085522982177;
    uint256 constant IC68y = 14241985426012834667162265580132367930069300083408246864012760379506830376305;
    
    uint256 constant IC69x = 17055415269621061604455591537532997981663834193732888017844713658379697205200;
    uint256 constant IC69y = 15802321273430379549572630253714558980654680366870564934136911666168749853221;
    
    uint256 constant IC70x = 6773782336176188174519194692783277872488247952415835366768181726306630170442;
    uint256 constant IC70y = 492506892370118568069866860324096889163847738650171199492133594561479291267;
    
    uint256 constant IC71x = 6042795892816516643954357644672177558343401884053015269923230425892437889551;
    uint256 constant IC71y = 15836600771891907324425415912255483145614921502997110995871684647018499138382;
    
    uint256 constant IC72x = 18218395183504906158237290416289733608799728048485433027267995434015731715417;
    uint256 constant IC72y = 13935824033790730147109756511539027352503229896823723031492748219956257934725;
    
    uint256 constant IC73x = 3853671355186278375065841960107184374267996065838509591530642562960848706898;
    uint256 constant IC73y = 6052151959684248175382474420294722088161531562690067173189340837929504201800;
    
    uint256 constant IC74x = 11997256492575674038149003690934768851607470983893779227188736171170307166246;
    uint256 constant IC74y = 15039245700908080694564247005440480199277903897174732669299750405665893449270;
    
    uint256 constant IC75x = 15139924963017972270474100933512741741015776374719484484447205573337037801983;
    uint256 constant IC75y = 9947997707837176554270656086235156131433962006646704792416461943227090908080;
    
    uint256 constant IC76x = 11396069203152834084944392932443459201309586065035425557313879889178923614754;
    uint256 constant IC76y = 13586648908128386284933780510128104253718654731195248749391363221672733885392;
    
    uint256 constant IC77x = 356093952954367311215461724993486689290522407600762156495441237831061747014;
    uint256 constant IC77y = 652723455848998372846971420290653024226716412948359559497401882264133020374;
    
    uint256 constant IC78x = 8111579405357701104332955257403992151754338300550660778066760161239057963760;
    uint256 constant IC78y = 17710198523591427701753138023872133817862356480181341777619569837642800165271;
    
    uint256 constant IC79x = 4376011611369231642440858407150055468023015551218138605690813213427331549929;
    uint256 constant IC79y = 1926096627544028827856293447250176475974779828199512783243235968215701124511;
    
    uint256 constant IC80x = 18257736272676986551084630601638548996924890557787409203115117003426729862306;
    uint256 constant IC80y = 13181335255734483802857399536493809313239860333718888401649948425929530481587;
    
    uint256 constant IC81x = 20076135174984778833750763132526896464989311362707557507237225917607775044611;
    uint256 constant IC81y = 341229253225863033385795657864744726881496088900763364966323347570235243083;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[81] calldata _pubSignals) public view returns (bool) {
        assembly {
            function checkField(v) {
                if iszero(lt(v, r)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }
            
            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination vk_x
                
                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))
                
                g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))
                
                g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))
                
                g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))
                
                g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))
                
                g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))
                
                g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))
                
                g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))
                
                g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))
                
                g1_mulAccC(_pVk, IC10x, IC10y, calldataload(add(pubSignals, 288)))
                
                g1_mulAccC(_pVk, IC11x, IC11y, calldataload(add(pubSignals, 320)))
                
                g1_mulAccC(_pVk, IC12x, IC12y, calldataload(add(pubSignals, 352)))
                
                g1_mulAccC(_pVk, IC13x, IC13y, calldataload(add(pubSignals, 384)))
                
                g1_mulAccC(_pVk, IC14x, IC14y, calldataload(add(pubSignals, 416)))
                
                g1_mulAccC(_pVk, IC15x, IC15y, calldataload(add(pubSignals, 448)))
                
                g1_mulAccC(_pVk, IC16x, IC16y, calldataload(add(pubSignals, 480)))
                
                g1_mulAccC(_pVk, IC17x, IC17y, calldataload(add(pubSignals, 512)))
                
                g1_mulAccC(_pVk, IC18x, IC18y, calldataload(add(pubSignals, 544)))
                
                g1_mulAccC(_pVk, IC19x, IC19y, calldataload(add(pubSignals, 576)))
                
                g1_mulAccC(_pVk, IC20x, IC20y, calldataload(add(pubSignals, 608)))
                
                g1_mulAccC(_pVk, IC21x, IC21y, calldataload(add(pubSignals, 640)))
                
                g1_mulAccC(_pVk, IC22x, IC22y, calldataload(add(pubSignals, 672)))
                
                g1_mulAccC(_pVk, IC23x, IC23y, calldataload(add(pubSignals, 704)))
                
                g1_mulAccC(_pVk, IC24x, IC24y, calldataload(add(pubSignals, 736)))
                
                g1_mulAccC(_pVk, IC25x, IC25y, calldataload(add(pubSignals, 768)))
                
                g1_mulAccC(_pVk, IC26x, IC26y, calldataload(add(pubSignals, 800)))
                
                g1_mulAccC(_pVk, IC27x, IC27y, calldataload(add(pubSignals, 832)))
                
                g1_mulAccC(_pVk, IC28x, IC28y, calldataload(add(pubSignals, 864)))
                
                g1_mulAccC(_pVk, IC29x, IC29y, calldataload(add(pubSignals, 896)))
                
                g1_mulAccC(_pVk, IC30x, IC30y, calldataload(add(pubSignals, 928)))
                
                g1_mulAccC(_pVk, IC31x, IC31y, calldataload(add(pubSignals, 960)))
                
                g1_mulAccC(_pVk, IC32x, IC32y, calldataload(add(pubSignals, 992)))
                
                g1_mulAccC(_pVk, IC33x, IC33y, calldataload(add(pubSignals, 1024)))
                
                g1_mulAccC(_pVk, IC34x, IC34y, calldataload(add(pubSignals, 1056)))
                
                g1_mulAccC(_pVk, IC35x, IC35y, calldataload(add(pubSignals, 1088)))
                
                g1_mulAccC(_pVk, IC36x, IC36y, calldataload(add(pubSignals, 1120)))
                
                g1_mulAccC(_pVk, IC37x, IC37y, calldataload(add(pubSignals, 1152)))
                
                g1_mulAccC(_pVk, IC38x, IC38y, calldataload(add(pubSignals, 1184)))
                
                g1_mulAccC(_pVk, IC39x, IC39y, calldataload(add(pubSignals, 1216)))
                
                g1_mulAccC(_pVk, IC40x, IC40y, calldataload(add(pubSignals, 1248)))
                
                g1_mulAccC(_pVk, IC41x, IC41y, calldataload(add(pubSignals, 1280)))
                
                g1_mulAccC(_pVk, IC42x, IC42y, calldataload(add(pubSignals, 1312)))
                
                g1_mulAccC(_pVk, IC43x, IC43y, calldataload(add(pubSignals, 1344)))
                
                g1_mulAccC(_pVk, IC44x, IC44y, calldataload(add(pubSignals, 1376)))
                
                g1_mulAccC(_pVk, IC45x, IC45y, calldataload(add(pubSignals, 1408)))
                
                g1_mulAccC(_pVk, IC46x, IC46y, calldataload(add(pubSignals, 1440)))
                
                g1_mulAccC(_pVk, IC47x, IC47y, calldataload(add(pubSignals, 1472)))
                
                g1_mulAccC(_pVk, IC48x, IC48y, calldataload(add(pubSignals, 1504)))
                
                g1_mulAccC(_pVk, IC49x, IC49y, calldataload(add(pubSignals, 1536)))
                
                g1_mulAccC(_pVk, IC50x, IC50y, calldataload(add(pubSignals, 1568)))
                
                g1_mulAccC(_pVk, IC51x, IC51y, calldataload(add(pubSignals, 1600)))
                
                g1_mulAccC(_pVk, IC52x, IC52y, calldataload(add(pubSignals, 1632)))
                
                g1_mulAccC(_pVk, IC53x, IC53y, calldataload(add(pubSignals, 1664)))
                
                g1_mulAccC(_pVk, IC54x, IC54y, calldataload(add(pubSignals, 1696)))
                
                g1_mulAccC(_pVk, IC55x, IC55y, calldataload(add(pubSignals, 1728)))
                
                g1_mulAccC(_pVk, IC56x, IC56y, calldataload(add(pubSignals, 1760)))
                
                g1_mulAccC(_pVk, IC57x, IC57y, calldataload(add(pubSignals, 1792)))
                
                g1_mulAccC(_pVk, IC58x, IC58y, calldataload(add(pubSignals, 1824)))
                
                g1_mulAccC(_pVk, IC59x, IC59y, calldataload(add(pubSignals, 1856)))
                
                g1_mulAccC(_pVk, IC60x, IC60y, calldataload(add(pubSignals, 1888)))
                
                g1_mulAccC(_pVk, IC61x, IC61y, calldataload(add(pubSignals, 1920)))
                
                g1_mulAccC(_pVk, IC62x, IC62y, calldataload(add(pubSignals, 1952)))
                
                g1_mulAccC(_pVk, IC63x, IC63y, calldataload(add(pubSignals, 1984)))
                
                g1_mulAccC(_pVk, IC64x, IC64y, calldataload(add(pubSignals, 2016)))
                
                g1_mulAccC(_pVk, IC65x, IC65y, calldataload(add(pubSignals, 2048)))
                
                g1_mulAccC(_pVk, IC66x, IC66y, calldataload(add(pubSignals, 2080)))
                
                g1_mulAccC(_pVk, IC67x, IC67y, calldataload(add(pubSignals, 2112)))
                
                g1_mulAccC(_pVk, IC68x, IC68y, calldataload(add(pubSignals, 2144)))
                
                g1_mulAccC(_pVk, IC69x, IC69y, calldataload(add(pubSignals, 2176)))
                
                g1_mulAccC(_pVk, IC70x, IC70y, calldataload(add(pubSignals, 2208)))
                
                g1_mulAccC(_pVk, IC71x, IC71y, calldataload(add(pubSignals, 2240)))
                
                g1_mulAccC(_pVk, IC72x, IC72y, calldataload(add(pubSignals, 2272)))
                
                g1_mulAccC(_pVk, IC73x, IC73y, calldataload(add(pubSignals, 2304)))
                
                g1_mulAccC(_pVk, IC74x, IC74y, calldataload(add(pubSignals, 2336)))
                
                g1_mulAccC(_pVk, IC75x, IC75y, calldataload(add(pubSignals, 2368)))
                
                g1_mulAccC(_pVk, IC76x, IC76y, calldataload(add(pubSignals, 2400)))
                
                g1_mulAccC(_pVk, IC77x, IC77y, calldataload(add(pubSignals, 2432)))
                
                g1_mulAccC(_pVk, IC78x, IC78y, calldataload(add(pubSignals, 2464)))
                
                g1_mulAccC(_pVk, IC79x, IC79y, calldataload(add(pubSignals, 2496)))
                
                g1_mulAccC(_pVk, IC80x, IC80y, calldataload(add(pubSignals, 2528)))
                
                g1_mulAccC(_pVk, IC81x, IC81y, calldataload(add(pubSignals, 2560)))
                

                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))


                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)


                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate that all evaluations ∈ F
            
            checkField(calldataload(add(_pubSignals, 0)))
            
            checkField(calldataload(add(_pubSignals, 32)))
            
            checkField(calldataload(add(_pubSignals, 64)))
            
            checkField(calldataload(add(_pubSignals, 96)))
            
            checkField(calldataload(add(_pubSignals, 128)))
            
            checkField(calldataload(add(_pubSignals, 160)))
            
            checkField(calldataload(add(_pubSignals, 192)))
            
            checkField(calldataload(add(_pubSignals, 224)))
            
            checkField(calldataload(add(_pubSignals, 256)))
            
            checkField(calldataload(add(_pubSignals, 288)))
            
            checkField(calldataload(add(_pubSignals, 320)))
            
            checkField(calldataload(add(_pubSignals, 352)))
            
            checkField(calldataload(add(_pubSignals, 384)))
            
            checkField(calldataload(add(_pubSignals, 416)))
            
            checkField(calldataload(add(_pubSignals, 448)))
            
            checkField(calldataload(add(_pubSignals, 480)))
            
            checkField(calldataload(add(_pubSignals, 512)))
            
            checkField(calldataload(add(_pubSignals, 544)))
            
            checkField(calldataload(add(_pubSignals, 576)))
            
            checkField(calldataload(add(_pubSignals, 608)))
            
            checkField(calldataload(add(_pubSignals, 640)))
            
            checkField(calldataload(add(_pubSignals, 672)))
            
            checkField(calldataload(add(_pubSignals, 704)))
            
            checkField(calldataload(add(_pubSignals, 736)))
            
            checkField(calldataload(add(_pubSignals, 768)))
            
            checkField(calldataload(add(_pubSignals, 800)))
            
            checkField(calldataload(add(_pubSignals, 832)))
            
            checkField(calldataload(add(_pubSignals, 864)))
            
            checkField(calldataload(add(_pubSignals, 896)))
            
            checkField(calldataload(add(_pubSignals, 928)))
            
            checkField(calldataload(add(_pubSignals, 960)))
            
            checkField(calldataload(add(_pubSignals, 992)))
            
            checkField(calldataload(add(_pubSignals, 1024)))
            
            checkField(calldataload(add(_pubSignals, 1056)))
            
            checkField(calldataload(add(_pubSignals, 1088)))
            
            checkField(calldataload(add(_pubSignals, 1120)))
            
            checkField(calldataload(add(_pubSignals, 1152)))
            
            checkField(calldataload(add(_pubSignals, 1184)))
            
            checkField(calldataload(add(_pubSignals, 1216)))
            
            checkField(calldataload(add(_pubSignals, 1248)))
            
            checkField(calldataload(add(_pubSignals, 1280)))
            
            checkField(calldataload(add(_pubSignals, 1312)))
            
            checkField(calldataload(add(_pubSignals, 1344)))
            
            checkField(calldataload(add(_pubSignals, 1376)))
            
            checkField(calldataload(add(_pubSignals, 1408)))
            
            checkField(calldataload(add(_pubSignals, 1440)))
            
            checkField(calldataload(add(_pubSignals, 1472)))
            
            checkField(calldataload(add(_pubSignals, 1504)))
            
            checkField(calldataload(add(_pubSignals, 1536)))
            
            checkField(calldataload(add(_pubSignals, 1568)))
            
            checkField(calldataload(add(_pubSignals, 1600)))
            
            checkField(calldataload(add(_pubSignals, 1632)))
            
            checkField(calldataload(add(_pubSignals, 1664)))
            
            checkField(calldataload(add(_pubSignals, 1696)))
            
            checkField(calldataload(add(_pubSignals, 1728)))
            
            checkField(calldataload(add(_pubSignals, 1760)))
            
            checkField(calldataload(add(_pubSignals, 1792)))
            
            checkField(calldataload(add(_pubSignals, 1824)))
            
            checkField(calldataload(add(_pubSignals, 1856)))
            
            checkField(calldataload(add(_pubSignals, 1888)))
            
            checkField(calldataload(add(_pubSignals, 1920)))
            
            checkField(calldataload(add(_pubSignals, 1952)))
            
            checkField(calldataload(add(_pubSignals, 1984)))
            
            checkField(calldataload(add(_pubSignals, 2016)))
            
            checkField(calldataload(add(_pubSignals, 2048)))
            
            checkField(calldataload(add(_pubSignals, 2080)))
            
            checkField(calldataload(add(_pubSignals, 2112)))
            
            checkField(calldataload(add(_pubSignals, 2144)))
            
            checkField(calldataload(add(_pubSignals, 2176)))
            
            checkField(calldataload(add(_pubSignals, 2208)))
            
            checkField(calldataload(add(_pubSignals, 2240)))
            
            checkField(calldataload(add(_pubSignals, 2272)))
            
            checkField(calldataload(add(_pubSignals, 2304)))
            
            checkField(calldataload(add(_pubSignals, 2336)))
            
            checkField(calldataload(add(_pubSignals, 2368)))
            
            checkField(calldataload(add(_pubSignals, 2400)))
            
            checkField(calldataload(add(_pubSignals, 2432)))
            
            checkField(calldataload(add(_pubSignals, 2464)))
            
            checkField(calldataload(add(_pubSignals, 2496)))
            
            checkField(calldataload(add(_pubSignals, 2528)))
            
            checkField(calldataload(add(_pubSignals, 2560)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
