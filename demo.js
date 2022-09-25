const func = async (value) => {
  if (value > 5)
    return await 111

  return 222
}

console.log(
  func(6),
)

console.log(
  func(3),
)

