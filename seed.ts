import db from './db.js'; // Ajuste o caminho do import caso o db.js esteja em outra pasta (ex: '../db')

async function main() {
    try {
        const query = `
            INSERT INTO products (name, description, price, stock, status) 
            VALUES (?, ?, ?, ?, ?)
        `;
        
        const values = [
            'Produto Teste',
            'Este é um produto de teste exclusivo',
            49.90,
            10,
            true
        ];

        // Se o seu db.js usa promises (ex: mysql2/promise)
        const [result]: any = await db.execute(query, values);

        console.log('Produto criado com sucesso! ID:', result.insertId);
    } catch (error) {
        console.error('Erro ao criar o produto:', error);
    } finally {
        process.exit();
    }
}

main();