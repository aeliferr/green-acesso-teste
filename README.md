### Pré-requisitos para rodar a aplicação:
Banco de dados postgres (usei a versão 17, mas pode ser outro)

Node >=20 (por causa da flag --env-file para leitura das variaveis de ambiente)


### Passos para iniciar a aplicação
Ao abrir o projeto, crie um arquivo .env e preencha as variáveis com os valores adequados. Deixei um .env_exemplo para referência.

É necessário também criar o banco de dados com o nome desejado, além de rodar o script database-schema.sql que está na raiz do projeto para a criação das tabelas (atenção ao comentários dentro do arquivo)

Pra finalizar, rode o comando 'npm install' e o projeto já vai estar pronto pra ser executado rodando o comando 'npm run dev'

O arquivo .csv a ser importado e o pdf contendo os boletos fake estão na raiz do projeto com os nomes boletos.csv e boletos_fake.pdf respectivamente

O arquivo contendo a coleção do postman está na raiz do projeto com o nome green-acesso-teste.postman_collection.json
