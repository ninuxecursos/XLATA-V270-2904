import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*'
}

const sitemapHeaders = {
  ...corsHeaders,
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=3600, s-maxage=3600',
}

// Complete city list synced with src/data/recyclingCitiesContent.ts
// 552 cities × 12 templates = 6,624 programmatic URLs
const recyclingCities: Record<string, Array<{ slug: string; stateAbbr: string }>> = {
  'sao-paulo': [
    { slug: 'guarulhos', stateAbbr: 'sp' }, { slug: 'campinas', stateAbbr: 'sp' }, { slug: 'sao-bernardo-do-campo', stateAbbr: 'sp' },
    { slug: 'santo-andre', stateAbbr: 'sp' }, { slug: 'osasco', stateAbbr: 'sp' }, { slug: 'sao-jose-dos-campos', stateAbbr: 'sp' },
    { slug: 'ribeirao-preto', stateAbbr: 'sp' }, { slug: 'sorocaba', stateAbbr: 'sp' }, { slug: 'santos', stateAbbr: 'sp' },
    { slug: 'maua', stateAbbr: 'sp' }, { slug: 'sao-jose-do-rio-preto', stateAbbr: 'sp' }, { slug: 'mogi-das-cruzes', stateAbbr: 'sp' },
    { slug: 'diadema', stateAbbr: 'sp' }, { slug: 'jundiai', stateAbbr: 'sp' }, { slug: 'piracicaba', stateAbbr: 'sp' },
    { slug: 'carapicuiba', stateAbbr: 'sp' }, { slug: 'bauru', stateAbbr: 'sp' }, { slug: 'itaquaquecetuba', stateAbbr: 'sp' },
    { slug: 'sao-vicente', stateAbbr: 'sp' }, { slug: 'franca', stateAbbr: 'sp' }, { slug: 'praia-grande', stateAbbr: 'sp' },
    { slug: 'guaruja', stateAbbr: 'sp' }, { slug: 'limeira', stateAbbr: 'sp' }, { slug: 'taubate', stateAbbr: 'sp' },
    { slug: 'suzano', stateAbbr: 'sp' }, { slug: 'taboao-da-serra', stateAbbr: 'sp' }, { slug: 'sumare', stateAbbr: 'sp' },
    { slug: 'embu-das-artes', stateAbbr: 'sp' }, { slug: 'barueri', stateAbbr: 'sp' }, { slug: 'marilia', stateAbbr: 'sp' },
    { slug: 'cotia', stateAbbr: 'sp' }, { slug: 'jacarei', stateAbbr: 'sp' }, { slug: 'americana', stateAbbr: 'sp' },
    { slug: 'indaiatuba', stateAbbr: 'sp' }, { slug: 'araraquara', stateAbbr: 'sp' }, { slug: 'presidente-prudente', stateAbbr: 'sp' },
    { slug: 'hortolandia', stateAbbr: 'sp' }, { slug: 'rio-claro', stateAbbr: 'sp' }, { slug: 'itapevi', stateAbbr: 'sp' },
    { slug: 'santa-barbara-doeste', stateAbbr: 'sp' },
  ],
  'minas-gerais': [
    { slug: 'belo-horizonte', stateAbbr: 'mg' }, { slug: 'uberlandia', stateAbbr: 'mg' }, { slug: 'contagem', stateAbbr: 'mg' },
    { slug: 'juiz-de-fora', stateAbbr: 'mg' }, { slug: 'betim', stateAbbr: 'mg' }, { slug: 'montes-claros', stateAbbr: 'mg' },
    { slug: 'ribeirao-das-neves', stateAbbr: 'mg' }, { slug: 'uberaba', stateAbbr: 'mg' }, { slug: 'governador-valadares', stateAbbr: 'mg' },
    { slug: 'ipatinga', stateAbbr: 'mg' }, { slug: 'sete-lagoas', stateAbbr: 'mg' }, { slug: 'divinopolis', stateAbbr: 'mg' },
    { slug: 'santa-luzia', stateAbbr: 'mg' }, { slug: 'ibirite', stateAbbr: 'mg' }, { slug: 'pocos-de-caldas', stateAbbr: 'mg' },
    { slug: 'patos-de-minas', stateAbbr: 'mg' }, { slug: 'pouso-alegre', stateAbbr: 'mg' }, { slug: 'teofilo-otoni', stateAbbr: 'mg' },
    { slug: 'barbacena', stateAbbr: 'mg' }, { slug: 'sabara', stateAbbr: 'mg' }, { slug: 'varginha', stateAbbr: 'mg' },
    { slug: 'conselheiro-lafaiete', stateAbbr: 'mg' }, { slug: 'nova-lima', stateAbbr: 'mg' }, { slug: 'araguari', stateAbbr: 'mg' },
    { slug: 'passos', stateAbbr: 'mg' },
  ],
  'rio-de-janeiro': [
    { slug: 'niteroi', stateAbbr: 'rj' }, { slug: 'sao-goncalo', stateAbbr: 'rj' }, { slug: 'duque-de-caxias', stateAbbr: 'rj' },
    { slug: 'nova-iguacu', stateAbbr: 'rj' }, { slug: 'sao-joao-de-meriti', stateAbbr: 'rj' }, { slug: 'belford-roxo', stateAbbr: 'rj' },
    { slug: 'campos-dos-goytacazes', stateAbbr: 'rj' }, { slug: 'petropolis', stateAbbr: 'rj' }, { slug: 'volta-redonda', stateAbbr: 'rj' },
    { slug: 'mage', stateAbbr: 'rj' }, { slug: 'itaborai', stateAbbr: 'rj' }, { slug: 'macae', stateAbbr: 'rj' },
    { slug: 'cabo-frio', stateAbbr: 'rj' }, { slug: 'nova-friburgo', stateAbbr: 'rj' }, { slug: 'barra-mansa', stateAbbr: 'rj' },
    { slug: 'angra-dos-reis', stateAbbr: 'rj' }, { slug: 'teresopolis', stateAbbr: 'rj' }, { slug: 'mesquita', stateAbbr: 'rj' },
    { slug: 'nilopolis', stateAbbr: 'rj' }, { slug: 'queimados', stateAbbr: 'rj' },
  ],
  'espirito-santo': [
    { slug: 'vitoria', stateAbbr: 'es' }, { slug: 'vila-velha', stateAbbr: 'es' }, { slug: 'serra', stateAbbr: 'es' },
    { slug: 'cariacica', stateAbbr: 'es' }, { slug: 'cachoeiro-de-itapemirim', stateAbbr: 'es' }, { slug: 'linhares', stateAbbr: 'es' },
    { slug: 'sao-mateus', stateAbbr: 'es' }, { slug: 'colatina', stateAbbr: 'es' }, { slug: 'guarapari', stateAbbr: 'es' },
    { slug: 'aracruz', stateAbbr: 'es' }, { slug: 'viana', stateAbbr: 'es' }, { slug: 'nova-venecia', stateAbbr: 'es' },
    { slug: 'barra-de-sao-francisco', stateAbbr: 'es' }, { slug: 'marataizes', stateAbbr: 'es' }, { slug: 'afonso-claudio', stateAbbr: 'es' },
    { slug: 'castelo', stateAbbr: 'es' }, { slug: 'alegre', stateAbbr: 'es' }, { slug: 'fundao', stateAbbr: 'es' },
    { slug: 'itapemirim', stateAbbr: 'es' }, { slug: 'pedro-canario', stateAbbr: 'es' },
  ],
  'parana': [
    { slug: 'curitiba', stateAbbr: 'pr' }, { slug: 'londrina', stateAbbr: 'pr' }, { slug: 'maringa', stateAbbr: 'pr' },
    { slug: 'ponta-grossa', stateAbbr: 'pr' }, { slug: 'cascavel', stateAbbr: 'pr' }, { slug: 'sao-jose-dos-pinhais', stateAbbr: 'pr' },
    { slug: 'foz-do-iguacu', stateAbbr: 'pr' }, { slug: 'colombo', stateAbbr: 'pr' }, { slug: 'guarapuava', stateAbbr: 'pr' },
    { slug: 'paranagua', stateAbbr: 'pr' }, { slug: 'araucaria', stateAbbr: 'pr' }, { slug: 'toledo', stateAbbr: 'pr' },
    { slug: 'apucarana', stateAbbr: 'pr' }, { slug: 'campo-largo', stateAbbr: 'pr' }, { slug: 'arapongas', stateAbbr: 'pr' },
    { slug: 'almirante-tamandare', stateAbbr: 'pr' }, { slug: 'umuarama', stateAbbr: 'pr' }, { slug: 'piraquara', stateAbbr: 'pr' },
    { slug: 'cambe', stateAbbr: 'pr' }, { slug: 'campo-mourao', stateAbbr: 'pr' },
  ],
  'rio-grande-do-sul': [
    { slug: 'porto-alegre', stateAbbr: 'rs' }, { slug: 'caxias-do-sul', stateAbbr: 'rs' }, { slug: 'canoas', stateAbbr: 'rs' },
    { slug: 'pelotas', stateAbbr: 'rs' }, { slug: 'santa-maria', stateAbbr: 'rs' }, { slug: 'gravatai', stateAbbr: 'rs' },
    { slug: 'viamao', stateAbbr: 'rs' }, { slug: 'novo-hamburgo', stateAbbr: 'rs' }, { slug: 'sao-leopoldo', stateAbbr: 'rs' },
    { slug: 'rio-grande', stateAbbr: 'rs' }, { slug: 'alvorada', stateAbbr: 'rs' }, { slug: 'passo-fundo', stateAbbr: 'rs' },
    { slug: 'sapucaia-do-sul', stateAbbr: 'rs' }, { slug: 'uruguaiana', stateAbbr: 'rs' }, { slug: 'santa-cruz-do-sul', stateAbbr: 'rs' },
    { slug: 'cachoeirinha', stateAbbr: 'rs' }, { slug: 'bage', stateAbbr: 'rs' }, { slug: 'bento-goncalves', stateAbbr: 'rs' },
    { slug: 'erechim', stateAbbr: 'rs' }, { slug: 'guaiba', stateAbbr: 'rs' },
  ],
  'santa-catarina': [
    { slug: 'florianopolis', stateAbbr: 'sc' }, { slug: 'joinville', stateAbbr: 'sc' }, { slug: 'blumenau', stateAbbr: 'sc' },
    { slug: 'sao-jose', stateAbbr: 'sc' }, { slug: 'chapeco', stateAbbr: 'sc' }, { slug: 'itajai', stateAbbr: 'sc' },
    { slug: 'criciuma', stateAbbr: 'sc' }, { slug: 'jaragua-do-sul', stateAbbr: 'sc' }, { slug: 'lages', stateAbbr: 'sc' },
    { slug: 'palhoca', stateAbbr: 'sc' }, { slug: 'balneario-camboriu', stateAbbr: 'sc' }, { slug: 'brusque', stateAbbr: 'sc' },
    { slug: 'tubarao', stateAbbr: 'sc' }, { slug: 'sao-bento-do-sul', stateAbbr: 'sc' }, { slug: 'cacador', stateAbbr: 'sc' },
    { slug: 'concordia', stateAbbr: 'sc' }, { slug: 'camboriu', stateAbbr: 'sc' }, { slug: 'navegantes', stateAbbr: 'sc' },
    { slug: 'rio-do-sul', stateAbbr: 'sc' }, { slug: 'indaial', stateAbbr: 'sc' },
  ],
  'bahia': [
    { slug: 'salvador', stateAbbr: 'ba' }, { slug: 'feira-de-santana', stateAbbr: 'ba' }, { slug: 'vitoria-da-conquista', stateAbbr: 'ba' },
    { slug: 'camacari', stateAbbr: 'ba' }, { slug: 'itabuna', stateAbbr: 'ba' }, { slug: 'juazeiro', stateAbbr: 'ba' },
    { slug: 'lauro-de-freitas', stateAbbr: 'ba' }, { slug: 'ilheus', stateAbbr: 'ba' }, { slug: 'jequie', stateAbbr: 'ba' },
    { slug: 'teixeira-de-freitas', stateAbbr: 'ba' }, { slug: 'alagoinhas', stateAbbr: 'ba' }, { slug: 'barreiras', stateAbbr: 'ba' },
    { slug: 'porto-seguro', stateAbbr: 'ba' }, { slug: 'simoes-filho', stateAbbr: 'ba' }, { slug: 'paulo-afonso', stateAbbr: 'ba' },
    { slug: 'eunapolis', stateAbbr: 'ba' }, { slug: 'santo-antonio-de-jesus', stateAbbr: 'ba' }, { slug: 'valenca', stateAbbr: 'ba' },
    { slug: 'candeias', stateAbbr: 'ba' }, { slug: 'luis-eduardo-magalhaes', stateAbbr: 'ba' },
  ],
  'pernambuco': [
    { slug: 'recife', stateAbbr: 'pe' }, { slug: 'jaboatao-dos-guararapes', stateAbbr: 'pe' }, { slug: 'olinda', stateAbbr: 'pe' },
    { slug: 'caruaru', stateAbbr: 'pe' }, { slug: 'petrolina', stateAbbr: 'pe' }, { slug: 'paulista', stateAbbr: 'pe' },
    { slug: 'cabo-de-santo-agostinho', stateAbbr: 'pe' }, { slug: 'camaragibe', stateAbbr: 'pe' }, { slug: 'garanhuns', stateAbbr: 'pe' },
    { slug: 'vitoria-de-santo-antao', stateAbbr: 'pe' }, { slug: 'igarassu', stateAbbr: 'pe' }, { slug: 'sao-lourenco-da-mata', stateAbbr: 'pe' },
    { slug: 'abreu-e-lima', stateAbbr: 'pe' }, { slug: 'ipojuca', stateAbbr: 'pe' }, { slug: 'serra-talhada', stateAbbr: 'pe' },
    { slug: 'araripina', stateAbbr: 'pe' }, { slug: 'gravata', stateAbbr: 'pe' }, { slug: 'carpina', stateAbbr: 'pe' },
    { slug: 'goiana', stateAbbr: 'pe' }, { slug: 'santa-cruz-do-capibaribe', stateAbbr: 'pe' },
  ],
  'ceara': [
    { slug: 'fortaleza', stateAbbr: 'ce' }, { slug: 'caucaia', stateAbbr: 'ce' }, { slug: 'juazeiro-do-norte', stateAbbr: 'ce' },
    { slug: 'maracanau', stateAbbr: 'ce' }, { slug: 'sobral', stateAbbr: 'ce' }, { slug: 'crato', stateAbbr: 'ce' },
    { slug: 'itapipoca', stateAbbr: 'ce' }, { slug: 'maranguape', stateAbbr: 'ce' }, { slug: 'iguatu', stateAbbr: 'ce' },
    { slug: 'quixada', stateAbbr: 'ce' }, { slug: 'pacatuba', stateAbbr: 'ce' }, { slug: 'aquiraz', stateAbbr: 'ce' },
    { slug: 'russas', stateAbbr: 'ce' }, { slug: 'caninde', stateAbbr: 'ce' }, { slug: 'tiangua', stateAbbr: 'ce' },
    { slug: 'crateus', stateAbbr: 'ce' }, { slug: 'pacajus', stateAbbr: 'ce' }, { slug: 'aracati', stateAbbr: 'ce' },
    { slug: 'horizonte', stateAbbr: 'ce' }, { slug: 'eusebio', stateAbbr: 'ce' },
  ],
  'maranhao': [
    { slug: 'sao-luis', stateAbbr: 'ma' }, { slug: 'imperatriz', stateAbbr: 'ma' }, { slug: 'sao-jose-de-ribamar', stateAbbr: 'ma' },
    { slug: 'timon', stateAbbr: 'ma' }, { slug: 'caxias', stateAbbr: 'ma' }, { slug: 'codo', stateAbbr: 'ma' },
    { slug: 'paco-do-lumiar', stateAbbr: 'ma' }, { slug: 'acailandia', stateAbbr: 'ma' }, { slug: 'bacabal', stateAbbr: 'ma' },
    { slug: 'balsas', stateAbbr: 'ma' }, { slug: 'santa-ines', stateAbbr: 'ma' }, { slug: 'chapadinha', stateAbbr: 'ma' },
    { slug: 'coroata', stateAbbr: 'ma' }, { slug: 'buriticupu', stateAbbr: 'ma' }, { slug: 'pedreiras', stateAbbr: 'ma' },
    { slug: 'itapecuru-mirim', stateAbbr: 'ma' }, { slug: 'viana-ma', stateAbbr: 'ma' }, { slug: 'grajau', stateAbbr: 'ma' },
    { slug: 'pinheiro', stateAbbr: 'ma' }, { slug: 'presidente-dutra', stateAbbr: 'ma' },
  ],
  'paraiba': [
    { slug: 'joao-pessoa', stateAbbr: 'pb' }, { slug: 'campina-grande', stateAbbr: 'pb' }, { slug: 'santa-rita', stateAbbr: 'pb' },
    { slug: 'patos', stateAbbr: 'pb' }, { slug: 'bayeux', stateAbbr: 'pb' }, { slug: 'sousa', stateAbbr: 'pb' },
    { slug: 'cajazeiras', stateAbbr: 'pb' }, { slug: 'cabedelo', stateAbbr: 'pb' }, { slug: 'guarabira', stateAbbr: 'pb' },
    { slug: 'sape', stateAbbr: 'pb' }, { slug: 'mamanguape', stateAbbr: 'pb' }, { slug: 'itabaiana-pb', stateAbbr: 'pb' },
    { slug: 'pombal', stateAbbr: 'pb' }, { slug: 'monteiro', stateAbbr: 'pb' }, { slug: 'esperanca', stateAbbr: 'pb' },
    { slug: 'alagoa-grande', stateAbbr: 'pb' }, { slug: 'rio-tinto', stateAbbr: 'pb' }, { slug: 'queimadas-pb', stateAbbr: 'pb' },
    { slug: 'soledad', stateAbbr: 'pb' }, { slug: 'catole-do-rocha', stateAbbr: 'pb' },
  ],
  'rio-grande-do-norte': [
    { slug: 'natal', stateAbbr: 'rn' }, { slug: 'mossoro', stateAbbr: 'rn' }, { slug: 'parnamirim', stateAbbr: 'rn' },
    { slug: 'sao-goncalo-do-amarante', stateAbbr: 'rn' }, { slug: 'macaiba', stateAbbr: 'rn' }, { slug: 'ceara-mirim', stateAbbr: 'rn' },
    { slug: 'caico', stateAbbr: 'rn' }, { slug: 'acu', stateAbbr: 'rn' }, { slug: 'currais-novos', stateAbbr: 'rn' },
    { slug: 'santa-cruz-rn', stateAbbr: 'rn' }, { slug: 'nova-cruz', stateAbbr: 'rn' }, { slug: 'apodi', stateAbbr: 'rn' },
    { slug: 'pau-dos-ferros', stateAbbr: 'rn' }, { slug: 'joao-camara', stateAbbr: 'rn' }, { slug: 'sao-jose-de-mipibu', stateAbbr: 'rn' },
    { slug: 'touros', stateAbbr: 'rn' }, { slug: 'extremoz', stateAbbr: 'rn' }, { slug: 'areia-branca', stateAbbr: 'rn' },
    { slug: 'canguaretama', stateAbbr: 'rn' }, { slug: 'goianinha', stateAbbr: 'rn' },
  ],
  'piaui': [
    { slug: 'teresina', stateAbbr: 'pi' }, { slug: 'parnaiba', stateAbbr: 'pi' }, { slug: 'picos', stateAbbr: 'pi' },
    { slug: 'piripiri', stateAbbr: 'pi' }, { slug: 'floriano', stateAbbr: 'pi' }, { slug: 'campo-maior', stateAbbr: 'pi' },
    { slug: 'barras', stateAbbr: 'pi' }, { slug: 'uniao', stateAbbr: 'pi' }, { slug: 'altos', stateAbbr: 'pi' },
    { slug: 'jose-de-freitas', stateAbbr: 'pi' }, { slug: 'pedro-ii', stateAbbr: 'pi' }, { slug: 'oeiras', stateAbbr: 'pi' },
    { slug: 'esperantina', stateAbbr: 'pi' }, { slug: 'corrente', stateAbbr: 'pi' }, { slug: 'sao-raimundo-nonato', stateAbbr: 'pi' },
    { slug: 'bom-jesus', stateAbbr: 'pi' }, { slug: 'uruçui', stateAbbr: 'pi' }, { slug: 'agua-branca', stateAbbr: 'pi' },
    { slug: 'guadalupe', stateAbbr: 'pi' }, { slug: 'valenca-pi', stateAbbr: 'pi' },
  ],
  'alagoas': [
    { slug: 'maceio', stateAbbr: 'al' }, { slug: 'arapiraca', stateAbbr: 'al' }, { slug: 'rio-largo', stateAbbr: 'al' },
    { slug: 'palmeira-dos-indios', stateAbbr: 'al' }, { slug: 'uniao-dos-palmares', stateAbbr: 'al' }, { slug: 'penedo', stateAbbr: 'al' },
    { slug: 'sao-miguel-dos-campos', stateAbbr: 'al' }, { slug: 'coruripe', stateAbbr: 'al' }, { slug: 'delmiro-gouveia', stateAbbr: 'al' },
    { slug: 'marechal-deodoro', stateAbbr: 'al' }, { slug: 'campo-alegre', stateAbbr: 'al' }, { slug: 'santana-do-ipanema', stateAbbr: 'al' },
    { slug: 'sao-jose-da-laje', stateAbbr: 'al' }, { slug: 'murici', stateAbbr: 'al' }, { slug: 'atalaia', stateAbbr: 'al' },
    { slug: 'matriz-de-camaragibe', stateAbbr: 'al' }, { slug: 'porto-calvo', stateAbbr: 'al' }, { slug: 'girau-do-ponciano', stateAbbr: 'al' },
    { slug: 'teotonio-vilela', stateAbbr: 'al' }, { slug: 'pilar', stateAbbr: 'al' },
  ],
  'sergipe': [
    { slug: 'aracaju', stateAbbr: 'se' }, { slug: 'nossa-senhora-do-socorro', stateAbbr: 'se' }, { slug: 'lagarto', stateAbbr: 'se' },
    { slug: 'itabaiana-se', stateAbbr: 'se' }, { slug: 'sao-cristovao', stateAbbr: 'se' }, { slug: 'estancia', stateAbbr: 'se' },
    { slug: 'tobias-barreto', stateAbbr: 'se' }, { slug: 'barra-dos-coqueiros', stateAbbr: 'se' }, { slug: 'simao-dias', stateAbbr: 'se' },
    { slug: 'capela', stateAbbr: 'se' }, { slug: 'itabaianinha', stateAbbr: 'se' }, { slug: 'proprio', stateAbbr: 'se' },
    { slug: 'carmopolis', stateAbbr: 'se' }, { slug: 'caninde-de-sao-francisco', stateAbbr: 'se' }, { slug: 'laranjeiras', stateAbbr: 'se' },
    { slug: 'maruim', stateAbbr: 'se' }, { slug: 'neopolis', stateAbbr: 'se' }, { slug: 'poco-verde', stateAbbr: 'se' },
    { slug: 'ribeiropolis', stateAbbr: 'se' }, { slug: 'umbauba', stateAbbr: 'se' },
  ],
  'goias': [
    { slug: 'goiania', stateAbbr: 'go' }, { slug: 'aparecida-de-goiania', stateAbbr: 'go' }, { slug: 'anapolis', stateAbbr: 'go' },
    { slug: 'rio-verde', stateAbbr: 'go' }, { slug: 'luziania', stateAbbr: 'go' }, { slug: 'aguas-lindas-de-goias', stateAbbr: 'go' },
    { slug: 'valparaiso-de-goias', stateAbbr: 'go' }, { slug: 'trindade', stateAbbr: 'go' }, { slug: 'formosa', stateAbbr: 'go' },
    { slug: 'novo-gama', stateAbbr: 'go' }, { slug: 'senador-canedo', stateAbbr: 'go' }, { slug: 'itumbiara', stateAbbr: 'go' },
    { slug: 'catalao', stateAbbr: 'go' }, { slug: 'jatai', stateAbbr: 'go' }, { slug: 'planaltina', stateAbbr: 'go' },
    { slug: 'caldas-novas', stateAbbr: 'go' }, { slug: 'cidade-ocidental', stateAbbr: 'go' }, { slug: 'goianesia', stateAbbr: 'go' },
    { slug: 'inhumas', stateAbbr: 'go' }, { slug: 'mineiros', stateAbbr: 'go' },
  ],
  'distrito-federal': [
    { slug: 'brasilia', stateAbbr: 'df' }, { slug: 'ceilandia', stateAbbr: 'df' }, { slug: 'taguatinga', stateAbbr: 'df' },
    { slug: 'samambaia', stateAbbr: 'df' }, { slug: 'plano-piloto', stateAbbr: 'df' }, { slug: 'aguas-claras', stateAbbr: 'df' },
    { slug: 'recanto-das-emas', stateAbbr: 'df' }, { slug: 'gama', stateAbbr: 'df' }, { slug: 'santa-maria-df', stateAbbr: 'df' },
    { slug: 'sobradinho', stateAbbr: 'df' }, { slug: 'planaltina-df', stateAbbr: 'df' }, { slug: 'brazlandia', stateAbbr: 'df' },
    { slug: 'sao-sebastiao', stateAbbr: 'df' }, { slug: 'vicente-pires', stateAbbr: 'df' }, { slug: 'paranoa', stateAbbr: 'df' },
    { slug: 'riacho-fundo', stateAbbr: 'df' }, { slug: 'itapoa', stateAbbr: 'df' }, { slug: 'nucleo-bandeirante', stateAbbr: 'df' },
    { slug: 'guara', stateAbbr: 'df' }, { slug: 'lago-sul', stateAbbr: 'df' },
  ],
  'mato-grosso': [
    { slug: 'cuiaba', stateAbbr: 'mt' }, { slug: 'varzea-grande', stateAbbr: 'mt' }, { slug: 'rondonopolis', stateAbbr: 'mt' },
    { slug: 'sinop', stateAbbr: 'mt' }, { slug: 'caceres', stateAbbr: 'mt' }, { slug: 'tangara-da-serra', stateAbbr: 'mt' },
    { slug: 'sorriso', stateAbbr: 'mt' }, { slug: 'lucas-do-rio-verde', stateAbbr: 'mt' }, { slug: 'primavera-do-leste', stateAbbr: 'mt' },
    { slug: 'barra-do-garcas', stateAbbr: 'mt' }, { slug: 'alta-floresta', stateAbbr: 'mt' }, { slug: 'pontes-e-lacerda', stateAbbr: 'mt' },
    { slug: 'nova-mutum', stateAbbr: 'mt' }, { slug: 'canarana', stateAbbr: 'mt' }, { slug: 'juina', stateAbbr: 'mt' },
    { slug: 'colider', stateAbbr: 'mt' }, { slug: 'campo-novo-do-parecis', stateAbbr: 'mt' }, { slug: 'confresa', stateAbbr: 'mt' },
    { slug: 'guarantã-do-norte', stateAbbr: 'mt' }, { slug: 'juara', stateAbbr: 'mt' },
  ],
  'mato-grosso-do-sul': [
    { slug: 'campo-grande', stateAbbr: 'ms' }, { slug: 'dourados', stateAbbr: 'ms' }, { slug: 'tres-lagoas', stateAbbr: 'ms' },
    { slug: 'corumba', stateAbbr: 'ms' }, { slug: 'ponta-pora', stateAbbr: 'ms' }, { slug: 'navirai', stateAbbr: 'ms' },
    { slug: 'nova-andradina', stateAbbr: 'ms' }, { slug: 'aquidauana', stateAbbr: 'ms' }, { slug: 'sidrolandia', stateAbbr: 'ms' },
    { slug: 'paranaiba', stateAbbr: 'ms' }, { slug: 'maracaju', stateAbbr: 'ms' }, { slug: 'cassilandia', stateAbbr: 'ms' },
    { slug: 'coxim', stateAbbr: 'ms' }, { slug: 'amambai', stateAbbr: 'ms' }, { slug: 'jardim', stateAbbr: 'ms' },
    { slug: 'rio-brilhante', stateAbbr: 'ms' }, { slug: 'ivinhema', stateAbbr: 'ms' }, { slug: 'mundo-novo', stateAbbr: 'ms' },
    { slug: 'bataguassu', stateAbbr: 'ms' }, { slug: 'miranda', stateAbbr: 'ms' },
  ],
  'para': [
    { slug: 'belem', stateAbbr: 'pa' }, { slug: 'ananindeua', stateAbbr: 'pa' }, { slug: 'santarem', stateAbbr: 'pa' },
    { slug: 'maraba', stateAbbr: 'pa' }, { slug: 'parauapebas', stateAbbr: 'pa' }, { slug: 'castanhal', stateAbbr: 'pa' },
    { slug: 'abaetetuba', stateAbbr: 'pa' }, { slug: 'cameta', stateAbbr: 'pa' }, { slug: 'marituba', stateAbbr: 'pa' },
    { slug: 'braganca', stateAbbr: 'pa' }, { slug: 'tucurui', stateAbbr: 'pa' }, { slug: 'altamira', stateAbbr: 'pa' },
    { slug: 'barcarena', stateAbbr: 'pa' }, { slug: 'tailandia', stateAbbr: 'pa' }, { slug: 'redencao', stateAbbr: 'pa' },
    { slug: 'capanema', stateAbbr: 'pa' }, { slug: 'tome-acu', stateAbbr: 'pa' }, { slug: 'breves', stateAbbr: 'pa' },
    { slug: 'salinopolis', stateAbbr: 'pa' }, { slug: 'itaituba', stateAbbr: 'pa' },
  ],
  'amazonas': [
    { slug: 'manaus', stateAbbr: 'am' }, { slug: 'parintins', stateAbbr: 'am' }, { slug: 'itacoatiara', stateAbbr: 'am' },
    { slug: 'manacapuru', stateAbbr: 'am' }, { slug: 'coari', stateAbbr: 'am' }, { slug: 'tefe', stateAbbr: 'am' },
    { slug: 'tabatinga', stateAbbr: 'am' }, { slug: 'maues', stateAbbr: 'am' }, { slug: 'rio-preto-da-eva', stateAbbr: 'am' },
    { slug: 'iranduba', stateAbbr: 'am' }, { slug: 'presidente-figueiredo', stateAbbr: 'am' }, { slug: 'autazes', stateAbbr: 'am' },
    { slug: 'sao-gabriel-da-cachoeira', stateAbbr: 'am' }, { slug: 'benjamin-constant', stateAbbr: 'am' }, { slug: 'eirunepe', stateAbbr: 'am' },
    { slug: 'humaitá', stateAbbr: 'am' }, { slug: 'boca-do-acre', stateAbbr: 'am' }, { slug: 'borba', stateAbbr: 'am' },
    { slug: 'novo-aripuana', stateAbbr: 'am' }, { slug: 'labrea', stateAbbr: 'am' },
  ],
  'rondonia': [
    { slug: 'porto-velho', stateAbbr: 'ro' }, { slug: 'ji-parana', stateAbbr: 'ro' }, { slug: 'ariquemes', stateAbbr: 'ro' },
    { slug: 'cacoal', stateAbbr: 'ro' }, { slug: 'vilhena', stateAbbr: 'ro' }, { slug: 'jaru', stateAbbr: 'ro' },
    { slug: 'rolim-de-moura', stateAbbr: 'ro' }, { slug: 'guajara-mirim', stateAbbr: 'ro' }, { slug: 'ouro-preto-do-oeste', stateAbbr: 'ro' },
    { slug: 'pimenta-bueno', stateAbbr: 'ro' }, { slug: 'buritis', stateAbbr: 'ro' }, { slug: 'nova-mamore', stateAbbr: 'ro' },
    { slug: 'machadinho-do-oeste', stateAbbr: 'ro' }, { slug: 'espigao-do-oeste', stateAbbr: 'ro' }, { slug: 'presidente-medici', stateAbbr: 'ro' },
    { slug: 'colorado-do-oeste', stateAbbr: 'ro' }, { slug: 'sao-miguel-do-guapore', stateAbbr: 'ro' }, { slug: 'alto-paraiso', stateAbbr: 'ro' },
    { slug: 'cerejeiras', stateAbbr: 'ro' }, { slug: 'alta-floresta-do-oeste', stateAbbr: 'ro' },
  ],
  'tocantins': [
    { slug: 'palmas', stateAbbr: 'to' }, { slug: 'araguaina', stateAbbr: 'to' }, { slug: 'gurupi', stateAbbr: 'to' },
    { slug: 'porto-nacional', stateAbbr: 'to' }, { slug: 'paraiso-do-tocantins', stateAbbr: 'to' }, { slug: 'colinas-do-tocantins', stateAbbr: 'to' },
    { slug: 'guarai', stateAbbr: 'to' }, { slug: 'tocantinopolis', stateAbbr: 'to' }, { slug: 'dianopolis', stateAbbr: 'to' },
    { slug: 'miracema-do-tocantins', stateAbbr: 'to' }, { slug: 'augustinopolis', stateAbbr: 'to' }, { slug: 'formoso-do-araguaia', stateAbbr: 'to' },
    { slug: 'pedro-afonso', stateAbbr: 'to' }, { slug: 'wanderlandia', stateAbbr: 'to' }, { slug: 'araguacu', stateAbbr: 'to' },
    { slug: 'xambioá', stateAbbr: 'to' }, { slug: 'arraias', stateAbbr: 'to' }, { slug: 'natividade', stateAbbr: 'to' },
    { slug: 'taguatinga-to', stateAbbr: 'to' }, { slug: 'lagoa-da-confusao', stateAbbr: 'to' },
  ],
  'acre': [
    { slug: 'rio-branco', stateAbbr: 'ac' }, { slug: 'cruzeiro-do-sul', stateAbbr: 'ac' }, { slug: 'sena-madureira', stateAbbr: 'ac' },
    { slug: 'tarauaca', stateAbbr: 'ac' }, { slug: 'feijo', stateAbbr: 'ac' }, { slug: 'brasileia', stateAbbr: 'ac' },
    { slug: 'epitaciolandia', stateAbbr: 'ac' }, { slug: 'senador-guiomard', stateAbbr: 'ac' }, { slug: 'xapuri', stateAbbr: 'ac' },
    { slug: 'placido-de-castro', stateAbbr: 'ac' }, { slug: 'mancio-lima', stateAbbr: 'ac' }, { slug: 'rodrigues-alves', stateAbbr: 'ac' },
    { slug: 'porto-walter', stateAbbr: 'ac' }, { slug: 'bujari', stateAbbr: 'ac' }, { slug: 'jordao', stateAbbr: 'ac' },
    { slug: 'marechal-thaumaturgo', stateAbbr: 'ac' }, { slug: 'porto-acre', stateAbbr: 'ac' }, { slug: 'acrelândia', stateAbbr: 'ac' },
    { slug: 'capixaba', stateAbbr: 'ac' }, { slug: 'manoel-urbano', stateAbbr: 'ac' },
  ],
  'amapa': [
    { slug: 'macapa', stateAbbr: 'ap' }, { slug: 'santana', stateAbbr: 'ap' }, { slug: 'laranjal-do-jari', stateAbbr: 'ap' },
    { slug: 'oiapoque', stateAbbr: 'ap' }, { slug: 'mazagao', stateAbbr: 'ap' }, { slug: 'porto-grande', stateAbbr: 'ap' },
    { slug: 'tartarugalzinho', stateAbbr: 'ap' }, { slug: 'pedra-branca-do-amapari', stateAbbr: 'ap' },
    { slug: 'vitoria-do-jari', stateAbbr: 'ap' }, { slug: 'calcoene', stateAbbr: 'ap' }, { slug: 'amapa-cidade', stateAbbr: 'ap' },
    { slug: 'ferreira-gomes', stateAbbr: 'ap' }, { slug: 'cutias', stateAbbr: 'ap' }, { slug: 'itaubal', stateAbbr: 'ap' },
    { slug: 'pracuuba', stateAbbr: 'ap' }, { slug: 'serra-do-navio', stateAbbr: 'ap' },
  ],
  'roraima': [
    { slug: 'boa-vista', stateAbbr: 'rr' }, { slug: 'rorainopolis', stateAbbr: 'rr' }, { slug: 'caracarai', stateAbbr: 'rr' },
    { slug: 'alto-alegre', stateAbbr: 'rr' }, { slug: 'mucajai', stateAbbr: 'rr' }, { slug: 'canta', stateAbbr: 'rr' },
    { slug: 'bonfim', stateAbbr: 'rr' }, { slug: 'pacaraima', stateAbbr: 'rr' }, { slug: 'normandia', stateAbbr: 'rr' },
    { slug: 'sao-joao-da-baliza', stateAbbr: 'rr' }, { slug: 'amajari', stateAbbr: 'rr' }, { slug: 'caroebe', stateAbbr: 'rr' },
    { slug: 'sao-luiz', stateAbbr: 'rr' }, { slug: 'iracema', stateAbbr: 'rr' }, { slug: 'uiramuta', stateAbbr: 'rr' },
  ],
}

const programmaticTemplates = [
  'sistema-ferro-velho', 'software-ferro-velho', 'app-gestao-reciclagem',
  'gestao-deposito-sucata', 'gestao-reciclagem', 'como-gerenciar-ferro-velho',
  'controle-estoque-sucata', 'controle-materiais-reciclagem',
  'controle-financeiro-ferro-velho', 'lucro-ferro-velho',
  'como-organizar-ferro-velho', 'organizar-patio-sucata',
]

function generateProgrammaticUrls(baseUrl: string): string[] {
  const urls: string[] = []
  for (const cities of Object.values(recyclingCities)) {
    for (const city of cities) {
      for (const template of programmaticTemplates) {
        urls.push(`${baseUrl}/blog/${template}-${city.slug}-${city.stateAbbr}`)
      }
    }
  }
  return urls
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const type = url.searchParams.get('type')
  const baseUrl = 'https://xlata.site'
  const now = new Date().toISOString().split('T')[0]

  if (type === 'pages') {
    return generatePagesSitemap(baseUrl, now)
  }

  if (type === 'shop') {
    return generateShopSitemap(baseUrl, now)
  }

  const blogMatch = type?.match(/^blog-(\d+)$/)
  if (blogMatch) {
    const pageNum = parseInt(blogMatch[1], 10)
    return generateBlogSitemap(baseUrl, now, pageNum)
  }

  if (type === 'recycling') {
    return generateRecyclingSitemap(baseUrl, now)
  }

  // Default: sitemap index
  return generateSitemapIndex(baseUrl, now)
})

async function generateShopSitemap(baseUrl: string, now: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )

  const [productsRes, categoriesRes, settingsRes] = await Promise.all([
    supabase.from('shop_products')
      .select('slug, updated_at, sitemap_priority, sitemap_changefreq, canonical_url, og_image, images, name')
      .eq('is_active', true).eq('is_visible', true).eq('allow_indexing', true),
    supabase.from('shop_categories').select('slug, updated_at').eq('is_active', true),
    supabase.from('shop_seo_settings').select('default_priority, default_changefreq, default_og_image').limit(1).maybeSingle()
  ])

  const defPriority = settingsRes.data?.default_priority ?? 0.7
  const defChangefreq = settingsRes.data?.default_changefreq ?? 'weekly'

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`

  // Static shop pages
  const staticShop = [
    { path: '/shop', priority: 1.0, changefreq: 'daily' },
    { path: '/shop/sobre', priority: 0.5, changefreq: 'monthly' },
    { path: '/shop/como-comprar', priority: 0.6, changefreq: 'monthly' },
    { path: '/shop/faq', priority: 0.5, changefreq: 'monthly' },
    { path: '/shop/interativas', priority: 0.8, changefreq: 'daily' },
  ]
  for (const s of staticShop) {
    xml += `  <url>
    <loc>${baseUrl}${s.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${s.changefreq}</changefreq>
    <priority>${s.priority}</priority>
  </url>
`
  }

  for (const c of categoriesRes.data || []) {
    xml += `  <url>
    <loc>${baseUrl}/shop?categoria=${c.slug}</loc>
    <lastmod>${(c as any).updated_at?.split('T')[0] || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`
  }

  const escapeXml = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  // Mask Supabase storage URLs behind our own domain (proxied via Vercel rewrite /cdn/*)
  const maskStorageUrl = (url: string | undefined | null): string => {
    if (!url) return ''
    return url.replace(/^https?:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\//i, `${baseUrl}/cdn/`)
  }

  for (const p of productsRes.data || []) {
    const loc = p.canonical_url || `${baseUrl}/shop/${p.slug}`
    const imgs = Array.isArray(p.images) ? p.images : []
    const ogImg = maskStorageUrl(p.og_image || imgs[0] || settingsRes.data?.default_og_image)
    xml += `  <url>
    <loc>${loc}</loc>
    <lastmod>${p.updated_at?.split('T')[0] || now}</lastmod>
    <changefreq>${p.sitemap_changefreq || defChangefreq}</changefreq>
    <priority>${p.sitemap_priority?.toString() || defPriority.toString()}</priority>`
    if (ogImg) {
      xml += `
    <image:image>
      <image:loc>${escapeXml(ogImg)}</image:loc>
      <image:title>${escapeXml(p.name)}</image:title>
    </image:image>`
    }
    xml += `
  </url>
`
  }

  xml += `</urlset>`

  console.log(`[sitemap-shop] ${(productsRes.data?.length || 0)} products, ${(categoriesRes.data?.length || 0)} categories`)

  return new Response(xml, { headers: sitemapHeaders })
}

async function generateSitemapIndex(baseUrl: string, now: string) {
  const totalProgrammatic = generateProgrammaticUrls(baseUrl).length
  const blogSitemapCount = Math.ceil(totalProgrammatic / 1000)

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-pages.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-shop.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-recycling.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
`
  for (let i = 1; i <= blogSitemapCount; i++) {
    xml += `  <sitemap>
    <loc>${baseUrl}/sitemap-blog-${i}.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
`
  }

  xml += `</sitemapindex>`

  console.log(`[generate-sitemap] Index: ${2 + blogSitemapCount} sub-sitemaps, ${totalProgrammatic} programmatic URLs`)

  return new Response(xml, { headers: sitemapHeaders })
}

async function generatePagesSitemap(baseUrl: string, now: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )

  const [staticPagesRes, blogPosts, helpArticles, pillarPages, glossaryTerms, localSeoPages, shopProducts] = await Promise.all([
    supabase.from('static_pages_seo').select('path, sitemap_priority, sitemap_changefreq, updated_at, canonical_url')
      .eq('include_in_sitemap', true).eq('allow_indexing', true),
    supabase.from('blog_posts').select('slug, updated_at, canonical_url, sitemap_priority, sitemap_changefreq')
      .eq('status', 'published').eq('allow_indexing', true),
    supabase.from('help_articles').select('slug, updated_at, canonical_url, sitemap_priority, sitemap_changefreq')
      .eq('status', 'published').eq('allow_indexing', true),
    supabase.from('pillar_pages').select('slug, updated_at, canonical_url, sitemap_priority, sitemap_changefreq')
      .eq('status', 'published').eq('allow_indexing', true),
    supabase.from('glossary_terms').select('slug, updated_at, canonical_url, sitemap_priority, sitemap_changefreq')
      .eq('status', 'published').eq('allow_indexing', true),
    supabase.from('local_seo_pages').select('slug, updated_at, canonical_url, sitemap_priority, sitemap_changefreq')
      .eq('status', 'published').eq('allow_indexing', true),
    supabase.from('shop_products').select('slug, updated_at, seo_title, seo_description')
      .eq('is_active', true).eq('is_visible', true),
  ])

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`

  for (const page of staticPagesRes.data || []) {
    const loc = page.canonical_url || `${baseUrl}${page.path}`
    xml += `  <url>
    <loc>${loc}</loc>
    <lastmod>${page.updated_at?.split('T')[0] || now}</lastmod>
    <changefreq>${page.sitemap_changefreq || 'monthly'}</changefreq>
    <priority>${page.sitemap_priority?.toString() || '0.5'}</priority>
  </url>
`
  }

  for (const post of blogPosts.data || []) {
    xml += `  <url>
    <loc>${post.canonical_url || `${baseUrl}/blog/${post.slug}`}</loc>
    <lastmod>${post.updated_at?.split('T')[0] || now}</lastmod>
    <changefreq>${post.sitemap_changefreq || 'weekly'}</changefreq>
    <priority>${post.sitemap_priority?.toString() || '0.7'}</priority>
  </url>
`
  }

  for (const a of helpArticles.data || []) {
    xml += `  <url>
    <loc>${a.canonical_url || `${baseUrl}/ajuda/artigo/${a.slug}`}</loc>
    <lastmod>${a.updated_at?.split('T')[0] || now}</lastmod>
    <changefreq>${a.sitemap_changefreq || 'monthly'}</changefreq>
    <priority>${a.sitemap_priority?.toString() || '0.6'}</priority>
  </url>
`
  }

  for (const p of pillarPages.data || []) {
    xml += `  <url>
    <loc>${p.canonical_url || `${baseUrl}/solucoes/${p.slug}`}</loc>
    <lastmod>${p.updated_at?.split('T')[0] || now}</lastmod>
    <changefreq>${p.sitemap_changefreq || 'weekly'}</changefreq>
    <priority>${p.sitemap_priority?.toString() || '0.8'}</priority>
  </url>
`
  }

  for (const t of glossaryTerms.data || []) {
    xml += `  <url>
    <loc>${t.canonical_url || `${baseUrl}/glossario/${t.slug}`}</loc>
    <lastmod>${t.updated_at?.split('T')[0] || now}</lastmod>
    <changefreq>${t.sitemap_changefreq || 'monthly'}</changefreq>
    <priority>${t.sitemap_priority?.toString() || '0.5'}</priority>
  </url>
`
  }

  for (const p of localSeoPages.data || []) {
    xml += `  <url>
    <loc>${p.canonical_url || `${baseUrl}/${p.slug}`}</loc>
    <lastmod>${p.updated_at?.split('T')[0] || now}</lastmod>
    <changefreq>${p.sitemap_changefreq || 'monthly'}</changefreq>
    <priority>${p.sitemap_priority?.toString() || '0.6'}</priority>
  </url>
`
  }

  for (const product of shopProducts.data || []) {
    xml += `  <url>
    <loc>${baseUrl}/shop/${product.slug}</loc>
    <lastmod>${product.updated_at?.split('T')[0] || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`
  }

  xml += `</urlset>`

  const stats = {
    static: staticPagesRes.data?.length || 0,
    blog: blogPosts.data?.length || 0,
    help: helpArticles.data?.length || 0,
    pillar: pillarPages.data?.length || 0,
    glossary: glossaryTerms.data?.length || 0,
    localSeo: localSeoPages.data?.length || 0,
    shop: shopProducts.data?.length || 0,
  }
  console.log(`[sitemap-pages] ${Object.values(stats).reduce((a, b) => a + b, 0)} URLs:`, stats)

  return new Response(xml, { headers: sitemapHeaders })
}

function generateRecyclingSitemap(baseUrl: string, now: string) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`

  for (const [state, cities] of Object.entries(recyclingCities)) {
    xml += `  <url>
    <loc>${baseUrl}/reciclagem/${state}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`
    for (const city of cities) {
      xml += `  <url>
    <loc>${baseUrl}/reciclagem/${state}/${city.slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`
    }
  }

  xml += `</urlset>`

  const totalStates = Object.keys(recyclingCities).length
  const totalCities = Object.values(recyclingCities).reduce((s, c) => s + c.length, 0)
  console.log(`[sitemap-recycling] ${totalStates} states + ${totalCities} cities = ${totalStates + totalCities} URLs`)

  return new Response(xml, { headers: sitemapHeaders })
}

function generateBlogSitemap(baseUrl: string, now: string, pageNum: number) {
  const allUrls = generateProgrammaticUrls(baseUrl)
  const perPage = 1000
  const start = (pageNum - 1) * perPage
  const end = start + perPage
  const pageUrls = allUrls.slice(start, end)

  if (pageUrls.length === 0) {
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`, {
      headers: sitemapHeaders
    })
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`

  for (const url of pageUrls) {
    xml += `  <url>
    <loc>${url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`
  }

  xml += `</urlset>`

  console.log(`[sitemap-blog-${pageNum}] ${pageUrls.length} URLs (page ${pageNum}, total ${allUrls.length})`)

  return new Response(xml, { headers: sitemapHeaders })
}
