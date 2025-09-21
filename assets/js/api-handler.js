const API_KEY = 'SUA_CHAVE_API';

async function getWeather(city) {
    try {
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
        );
        console.log(response.data);
        // Processar dados da API aqui
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
    }
}