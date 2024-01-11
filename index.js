//--importando biblioteca---//
const { WebSocketServer } = require('ws');
require("dotenv").config();


//-objeto de usuarios que guarda as conexoes websocket-//
var Users = {}; 
const Port = process.env.SERVERPORT||3000 

//--instanciando ws---//
const wss = new WebSocketServer({port: Port});
console.log(`o servidor roda na porta ${Port}`);


//====Funções que serão usadas no codigo=======//
function Controller(client,data) { 
    try {
        const MessageJson = JSON.parse(data);//pega a mensagem e conver para Json
        if(MessageJson.metod){
            //leitura
            if(MessageJson.metod.toLowerCase() == "read"){
                    //o objeto guarda categorias aqui ele verifica se a categoria do leitor ja existe
                if(!Users[MessageJson.category]){
                    Users[MessageJson.category] = [] //se n existir ele cria
                 }
                    // Verifique se o cliente já está registrado na categoria
                if (!Users[MessageJson.category].includes(client)) { //quando eu quero ver dentro do vetor/array uso includes, e verifico se esse cliente existe na categoria, a funcao retorna true se existir por isso uso !
                        Users[MessageJson.category].push(client);
                        client.send(`cadastrado na categoria: ${MessageJson.category}`);    
                } else {
                        client.send("voce ja esta cadastrado nessa categoria");
                }       
            }
            
            //publicação
           if(MessageJson.metod.toLowerCase() == "publish" && MessageJson.menssage && MessageJson.category){
                //forma para enviar msg a mais de um usuario por vez
                const menssagemtratada = MessageJson.menssage.split('-') 
                const categorytratada = MessageJson.category.split('-')
                const responsetratada = MessageJson.response.split('-')
                for(position in categorytratada){
                    if(Users[categorytratada[position]]){
                        client.send("mensagem do "+categorytratada[position]+" enviada");
                        sendMessageToClients(categorytratada[position], menssagemtratada[position], client, responsetratada[position]);
                    }else{
                        client.send("verifique a conexão do "+categorytratada[position]);
                     }
                }

                // categorytratada.forEach((category,position) => {
                //         console.log(position, category)
                // });

            //   if(Users[MessageJson.category]){
            //     sendMessageToClients(MessageJson.category,MessageJson.mensagem,client, MessageJson.response)
            //   }else{
            //      client.send("Verifique a conexão do seu dispositico, e a categoria cadastrada!");
            //    }
           } 
           
           //consultar categorias
           if(MessageJson.metod.toLowerCase() == "categorias"){
                client.send(Object.keys(Users).toString("utf8"));
            } 

        }else{
            client.send("padrão errado, metodo é obrigatorio!");
          }
    } catch (error) {
        client.send("formato errado");
      }
}

// funcão para enviar mensagem a um cliente e receber uma de volta
function sendMessageToClients(category, message, clientpublish, publishresponse) {
    Users[category].forEach(async (client)=>{
       client.send(message);
       let time = message[0] == "u" ? 60000:5000
       if(publishresponse == "true"){
            const response = new Promise ((resolve,reject)=>{
                const returnmessage = (data) => {
                    try {
                        const returndata = JSON.parse(data)
                        if(/*returndata.metodo == "response" &&*/ returndata.menssage){
                            resolve(returndata.menssage);
                        }else{
                            reject("formato errado no arduino");
                        }
                    } catch (error) {
                        reject("formato errado no jason");
                      }
                    client.removeListener("message", returnmessage);
                }
                client.on('message', returnmessage)
                const timeout = setTimeout(()=>{
                    client.removeListener("message", returnmessage);
                    clearTimeout(timeout);
                    reject("mensagem de volta não recebida, verifique a conexão do " + category)
                },time)

            })
            try {
                clientpublish.send("resposta de "+ category + ": " +await response)
            } catch (error) {
                clientpublish.send(error)
            }
       }
    })
}




//--abre uma instancia de conexão do servidor---//
wss.on('connection', function connection(ws) {
    //mensagem que o cliente recebe quando se conecta
    ws.send('bem vindo sou um servidor para controlar vc, para se cadastrar me envie uma mensagem com as seguintes informaçoes e no padrão json: { --obrigatorios--"category": "//categoria que deseja participar",     "metodo": "//publish,read,response ou main"      ---caso publish adicione a mensagem "mensagem":      -------caso espere uma resposta (opcional) "response":true}');
    ws.on('message', function message(data) {
        Controller(ws,data);
    });
    //atribui isAlive para o objeto ws de forma que fique acessivel a todo escopo
    ws.isAlive = 0;
    ws.on('pong',function(){
        ws.isAlive = 0
    })
    //define um intervalo para os pings e mata clientes desconectados
    const interval = setInterval(()=>{
           if(ws.isAlive == 2){
               ws.terminate();
               clearInterval(interval);
               //percorre todas as keys do objeto, category retorna cada categoria
               for(let category in Users){
                    let resultados = Users[category].filter((UsersArr)=> UsersArr != ws); //filter recebe cada elemento do array faz uma comparação e retorna um novo array
                    Users[category] = resultados

                    //verifica se o tamanho do array da categoria é zero para exluir
                    if(Users[category].length == 0){
                        delete Users[category]
                    }
               }
              
           }

           ws.ping();
           ws.isAlive= ws.isAlive+1;
    },10000)
});

