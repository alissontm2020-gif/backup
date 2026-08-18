import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const produto = await prisma.product.create({
        data: {
            name: 'Produto Teste',
            description: 'Este é um produto de teste exclusivo',
            price: 49.90,
            stock: 10,
            status: true
        }
    });
    console.log('Produto criado com sucesso!', produto);
}

main();