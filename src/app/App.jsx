import React from 'react';

export default function App ({ manifest }) {

  // const file = `../data/${manifest.files[0]}`;
  const file = 'data/ball.json';
  const data = fetch(file).then(res => res.json()).then(data => console.log('data', data));


  console.log('manifest', manifest);
  return 'done';
}