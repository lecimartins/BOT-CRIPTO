const apiKey = process.env.API_KEY;
const apiSecret = process.env.API_SECRET;
const Binance = require('node-binance-api');
const binance = new Binance().options({
  APIKEY: apiKey,
  APISECRET: apiSecret
});
const { Telegraf } = require('telegraf')
const bot = new Telegraf(TeleAPI)
const WebSocket = require('ws');
const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@bookTicker');
const boll = require('keltnerchannel').boll;

let ifrOut = [];
let alvoC = 0;
let alvoV = 0;
let stopC = 0;
let stopV = 0;
let entradaC = 0;
let entradaV = 0;
let travaAlvoCompra = 1;
let travaAlvoVenda = 1;
let alvoVenda1 = 0; let alvoVenda2 = 0; let alvoVenda3 = 0;
let alvoCompra1 = 0; let alvoCompra2 = 0; let alvoCompra3 = 0;
let bandaSuperior = 0;
let bandaInferior = 0;
let lucroC = 0;
let lucroV = 0;
let bbMedia = 0;
let hora = '';
let pAtual = 0;
let porcentagemC = '';
let porcentagemV = '';
let temporizadorV = 3;
let temporizadorC = 3;
let timestamp = 3
let sLucro1 = 0;
const state = require('./csv-banco-dados')
let content = ''
let alertaVivo = 5
let aporteC = 0;
let aporteV = 0;
let precoBackup = 0
console.log('INICIANDO');
bot.telegram.sendMessage(1246307821,'5m --> INICIANDO!')

ws.onmessage = (data) => {
    dataParse = JSON.parse(data.data);
    pAtual  = parseInt(`${dataParse.a}`)
    timestamp = (new Date().getTime())
    hora = new Date;
   
  }

  binance.websockets.chart("BTCUSDT", "5m", (symbol, interval, chart) => {
    timestamp = (new Date().getTime())            
    let ohlc = binance.ohlc(chart);
    //Bollinger Bands
    let data = ohlc.close.slice(-20);
    let out = boll(data, 20, 2, true);
    let ifrData = ohlc.close
    //RSI(IFR)
    var RSI = require('technicalindicators').RSI;
    var inputRSI = {
        values : ifrData,
        period : 14
    };
    var IFR = RSI.calculate(inputRSI)
    precoBackup = ohlc.close.slice(-1);
    pAtual = precoBackup;


    bbMedia = parseInt(out.mid)
    ifrOut = IFR.slice(-1);
    bandaSuperior = parseInt(out.upper);
    alvoVenda1 = parseInt(bandaSuperior+(bandaSuperior*0.003));
    //alvoVenda2 = parseInt(stopV-1);
    //alvoVenda3 = parseInt(stopV-1);
    //BANDA INFERIOR
    bandaInferior = parseInt(out.lower);  
    alvoCompra1 = parseInt(bandaInferior-(bandaInferior*0.002))
    //alvoCompra2 = parseInt(stopC+1)
    //alvoCompra3 = parseInt(stopC+1)
    
  });//Alvos,BB e IRF

  setInterval(() => {
    timestamp = (new Date().getTime())
 
    //LUCROS
    lucroC = parseInt((alvoC-entradaC));
    porcentagemC = ((Math.floor(((lucroC)/(entradaC/100))*100))/100); 
    lucroV = parseInt((entradaV-alvoV));
    porcentagemV = ((Math.floor(((lucroV)/(entradaV/100))*100))/100);
 
    //BACKTEST
    if (alvoC > 2 && pAtual >= alvoC) {
      alertaVivo = timestamp + 3600000;
        hora = new Date;
        let gain = (Math.floor((aporteC*(porcentagemC/100))*100))/100;
        sLucro1 = ((Math.floor(((gain-(aporteC*0.002)))*100))/100);
        let opAlvo1 ={
          Data: hora,
          Lado: 'Compra',
          Entrada: entradaC,
          Saida: alvoC,
          Situação: 'GANHO',
          LucroSimulado: sLucro1,  
        }
        content = opAlvo1;
        state.save(content);
        bot.telegram.sendMessage(1246307821,'Alvo de Compra Atingido: '+alvoC+' Lucro: '+sLucro1+' '+porcentagemC+'% '+hora+gain)
        travaAlvoCompra = 1;
        alvoC = 0;
        stopC = 0;
        alvoCompra2 = 0;
        alvoCompra3 = 0;
        aporteC = 0;
        
    }else if(alvoC > 2 && pAtual <= stopC){
      temporizadorC = timestamp+300000;  
      alertaVivo = timestamp + 3600000; 
       hora = new Date;
      let gain = (Math.floor((aporteC*(porcentagemC/100))*100))/100;
        sLucro1 = (Math.floor((gain+(aporteC*0.002))*100))/100;
      let opStop1 ={
        Data: hora,
        Lado: 'Compra',
        Entrada: entradaC,
        Saida: stopC, 
        Situação: 'PERDA',
        LucroSimulado: (sLucro1*(-1)), 
      }
      content = opStop1;
      state.save(content);
      bot.telegram.sendMessage(1246307821,'Stop de compra atingido: '+stopC+' Prejuizo: '+(sLucro1*(-1))+' '+(porcentagemC*(-1))+'% '+hora+gain)
      travaAlvoCompra = 1;
      alvoC = 0;
      stopC = 0;
      alvoCompra2 = 0;
      alvoCompra3 = 0;
      aporteC = 0;

    }else if(alvoV > 2 && pAtual <= alvoV){
      alertaVivo = timestamp + 3600000;
        hora = new Date;
        let gain = (Math.floor((aporteV*(porcentagemV/100))*100))/100;
          sLucro1 = (Math.floor((gain-(aporteV*0.002))*100))/100;
        let opAlvo1 ={
          Data: hora,
          Lado: 'Venda',
          Entrada: entradaV,
          Saida: alvoV, 
          Situação: 'GANHO',
          LucroSimulado: (sLucro1),
        }
        content = opAlvo1;
        state.save(content);
        bot.telegram.sendMessage(1246307821,'Alvo de Venda Atingido: '+alvoV+' Lucro: '+(sLucro1)+' '+((Math.floor((porcentagemV)*100))/100 )+'% '+hora+gain)
        travaAlvoVenda = 1;
        alvoV = 0;
        stopV = 0;
        alvoVenda2 = 0;
        alvoVenda3 = 0;
        aporteV = 0;
    }else if(alvoV > 2 && pAtual >= stopV){

        alertaVivo = timestamp + 3600000;
        temporizadorV = timestamp+300000;   
        hora = new Date;
        let gain = (Math.floor((aporteV*(porcentagemV/100))*100))/100;
          sLucro1 = ((Math.floor((gain+(aporteV*0.002))*100))/100)*(-1);
        let opStop1 ={
          Data: hora,
          Lado: 'Venda',
          Entrada: entradaV,
          Saida: stopV,
          Situação: 'PERDA',
          LucroSimulado: sLucro1,  
        }
        content = opStop1;
        state.save(content);
        bot.telegram.sendMessage(1246307821,'Stop de venda atingido: '+stopV+' Prejuizo: '+sLucro1+' '+(porcentagemV*(-1))+'% '+hora+gain)
        travaAlvoVenda = 1;
        alvoV = 0;
        stopV = 0;
        alvoVenda2 = 0;
        alvoVenda3 = 0;
        aporteV = 0;
    }    
 }, 20);//saidas

 setInterval(() => {
    if      (travaAlvoVenda == 1 && ifrOut>70 && pAtual > alvoVenda1 && temporizadorV <= timestamp && pAtual>2) {
        aporteV = 20;
        temporizadorV = timestamp+300000;  
        entradaV = ((Math.floor(((pAtual))*100))/100);
        alvoV = ((Math.floor(((bbMedia+1))*100))/100); //alvo ser media *0,999
        stopV = parseInt(((entradaV-alvoV))+entradaV);
        alertaVivo = timestamp + 3600000;
        bot.telegram.sendMessage(1246307821,hora+'Vendido 1 em: '+pAtual+' alvo: '+alvoV+' Stop: '+stopV);
        travaAlvoVenda = 2;
        alvoVenda2 = parseInt(stopV-10);
        
    }else if(travaAlvoVenda == 2 && ifrOut>70 && pAtual > alvoVenda2 && alvoVenda2 > 0) {
        aporteV = 40;
        temporizadorV = timestamp+300000;
        entradaV = ((Math.floor(((pAtual))*100))/100);
        alvoV = ((Math.floor(((bbMedia+1))*100))/100); //alvo ser media *0,999
        stopV = parseInt(((entradaV-alvoV))+entradaV);
        alertaVivo = timestamp + 3600000;
        bot.telegram.sendMessage(1246307821,hora+'Vendido 2 em: '+pAtual+' alvo: '+alvoV+' Stop: '+stopV);
        travaAlvoVenda = 3;
        alvoVenda3 = parseInt(stopV-10);

    }else if(travaAlvoVenda == 3 && ifrOut>70 && pAtual > alvoVenda3  && alvoVenda3 > 0) {
        aporteV = 80;
        temporizadorV = timestamp+300000;
        entradaV = ((Math.floor(((pAtual))*100))/100);
        alvoV = ((Math.floor(((bbMedia+1))*100))/100);  //alvo ser media *0,999
        stopV = parseInt(((entradaV-alvoV))+entradaV);
        alertaVivo = timestamp + 3600000;
        bot.telegram.sendMessage(1246307821,hora+'Vendido 3 em: '+pAtual+' alvo: '+alvoV+' Stop: '+stopV);
        travaAlvoVenda = 0;

    }else if(travaAlvoCompra == 1 && ifrOut<30 && pAtual < alvoCompra1 && temporizadorC <= timestamp && pAtual>2) {
        aporteC = 20;
        temporizadorC = timestamp+300000;
        entradaC = ((Math.floor((((pAtual)))*100))/100);
        alvoC = ((Math.floor(((bbMedia-1))*100))/100);  //alvo ser media *0,999
        stopC = parseInt(entradaC-((alvoC-entradaC)));
        alertaVivo = timestamp + 3600000;
        bot.telegram.sendMessage(1246307821,hora+'Comprado 1 em: '+pAtual+' alvo: '+alvoC+' Stop: '+stopC);
        travaAlvoCompra = 2;
        alvoCompra2 = parseInt(stopC+10)

    }else if(travaAlvoCompra == 2 && ifrOut<30 && pAtual < alvoCompra2 && alvoCompra2 > 0) {
        aporteC = 40;
        temporizadorC = timestamp+300000;
        entradaC = ((Math.floor((((pAtual)))*100))/100);
        alvoC = ((Math.floor(((bbMedia-1))*100))/100);
        stopC = parseInt(entradaC-((alvoC-entradaC)));
        alertaVivo = timestamp + 3600000;
        bot.telegram.sendMessage(1246307821,hora+'Comprado 2 em: '+pAtual+' alvo: '+alvoC+' Stop: '+stopC);
        travaAlvoCompra = 3;
        alvoCompra3 = parseInt(stopC+10)

    }else if(travaAlvoCompra == 3 && ifrOut<30 && pAtual < alvoCompra3 && alvoCompra3 > 0) {
        aporteC = 80;
        temporizadorC = timestamp+300000;
        entradaC = ((Math.floor((((pAtual)))*100))/100);
        alvoC = ((Math.floor(((bbMedia-1))*100))/100);
        stopC = parseInt(entradaC-((alvoC-entradaC)));
        alertaVivo = timestamp + 3600000;
        bot.telegram.sendMessage(1246307821,hora+'Comprado 3 em: '+pAtual+' alvo: '+alvoC+' Stop: '+stopC);
        travaAlvoCompra = 0;

    }//03-07-22 O alvo do IRF estava invertido, ele so comprava se fosse maior que 30.
}, 20);//entradas

setInterval(() => {
    if (timestamp >= alertaVivo) {
      bot.telegram.sendMessage(1246307821,'5m '+'->'+pAtual+'<-'+' Alvo Venda: '+alvoVenda1+' Alvo Compra: '+alvoCompra1)
    }
  }, 3600000);//aviso de atividade telegram

  setInterval(() => {
    
      process.stdout.write('\033c');
      
      console.log('-->BACKTEST 5m<--');
      console.log('--------------------');

      console.log('RSI '+ifrOut);
      console.log('Preço Atual: ' + pAtual);
      console.log('--------------------');

      console.log('Banda Superior: ' + bandaSuperior);
      console.log('Alvo 1: '+alvoVenda1);
      console.log('Alvo 2: '+alvoVenda2);
      console.log('Alvo 3: '+alvoVenda3);
      console.log('Temporizador: '+temporizadorV);
      console.log('--------------------');

      console.log('Banda Inferior: ' + bandaInferior);
      console.log('Alvo 1: '+alvoCompra1);
      console.log('Alvo 2: '+alvoCompra2);
      console.log('Alvo 3: '+alvoCompra3);
      console.log('Temporizador: '+temporizadorC);
      console.log('--------------------'); 

      console.log('timestamp atual: ' + timestamp)
      console.log(hora);
      console.log('--------------------');

      console.log('Alvo da Compra: '+alvoC);
      console.log('Aporte: '+aporteC);
    
      console.log('--------------------');
      console.log('Alvo da Venda: '+alvoV);
      console.log('Aporte: '+aporteV);

      console.log('---------');
      console.log(precoBackup);
    
      
    
  }, 100);//monitor