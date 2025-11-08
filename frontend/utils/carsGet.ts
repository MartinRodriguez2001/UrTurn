
export const fetchCarMakes = async () => {
  const response = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json');
  const data = await response.json();
  return data.Results;
};

export const fetchCarModels = async (makeId: number) => {
  const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformakeid/${makeId}?format=json`);
  const data = await response.json();
  return data.Results;
};