import bcrypt from 'bcrypt';

const run = async () => {
  const hash = await bcrypt.hash('36163616', 10);
  console.log(hash);
};
run();
