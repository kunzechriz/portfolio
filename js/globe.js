// js/globe.js

document.addEventListener("DOMContentLoaded", () => {
    const globeVizContainer = document.getElementById('globeViz');
    if (!globeVizContainer) return;

    // List of visited countries (using ISO_A3 country codes)
    // Germany: DEU, Austria: AUT, Switzerland: CHE, Italy: ITA, Spain: ESP,
    // France: FRA, Slovenia: SVN, Morocco: MAR, Indonesia: IDN, Philippines: PHL,
    // Vietnam: VNM, Japan: JPN, Australia: AUS, New Zealand: NZL, USA: USA, 
    // Mexico: MEX, China: CHN
    const visitedCountries = [
        'DEU', 'AUT', 'CHE', 'ITA', 'ESP', 'FRA', 'SVN', 
        'MAR', 'IDN', 'PHL', 'VNM', 'JPN', 'AUS', 'NZL', 
        'USA', 'MEX', 'CHN'
    ];

    // Colors
    const accentColor = '#00ffcc'; // matches var(--accent-color)
    const defaultCountryColor = 'rgba(255, 255, 255, 0.05)';
    const visitedCountryColor = 'rgba(0, 255, 204, 0.4)';
    const hoverColor = 'rgba(0, 255, 204, 0.8)';

    // Init Globe
    const world = Globe()
        (globeVizContainer)
        .backgroundColor('rgba(0,0,0,0)')
        .showGlobe(true)
        .showAtmosphere(true)
        .atmosphereColor(accentColor)
        .atmosphereAltitude(0.15)
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg') // Dark themed earth
        .polygonsData([])
        .polygonAltitude(d => visitedCountries.includes(d.properties.ISO_A3) ? 0.02 : 0.01)
        .polygonCapColor(d => visitedCountries.includes(d.properties.ISO_A3) ? visitedCountryColor : defaultCountryColor)
        .polygonSideColor(() => 'rgba(0, 0, 0, 0.2)')
        .polygonStrokeColor(() => '#111')
        .polygonLabel(({ properties: d }) => `
            <div style="background: rgba(10, 10, 12, 0.9); padding: 8px 12px; border-radius: 4px; border: 1px solid ${accentColor}; font-family: 'Inter', sans-serif; color: #fff;">
                <b>${d.ADMIN}</b>
                ${visitedCountries.includes(d.ISO_A3) ? '<br><span style="color: #00ffcc; font-size: 0.8rem;">Visited</span>' : ''}
            </div>
        `)
        .onPolygonHover(hoverD => {
            world
                .polygonAltitude(d => d === hoverD ? 0.06 : (visitedCountries.includes(d.properties.ISO_A3) ? 0.02 : 0.01))
                .polygonCapColor(d => d === hoverD ? hoverColor : (visitedCountries.includes(d.properties.ISO_A3) ? visitedCountryColor : defaultCountryColor));
        })
        .polygonsTransitionDuration(300);

    // Fetch GeoJSON data
    fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
        .then(res => res.json())
        .then(countries => {
            world.polygonsData(countries.features);
            
            // Set initial camera view (centered around Europe/Africa as a nice starting point)
            world.pointOfView({ lat: 20, lng: 10, altitude: 2.2 });
        });

    // Auto-rotate
    world.controls().autoRotate = true;
    world.controls().autoRotateSpeed = 0.5;

    // Initial resize to fit container
    const resizeGlobe = () => {
        if (globeVizContainer) {
            const width = globeVizContainer.clientWidth;
            const height = globeVizContainer.clientHeight;
            world.width(width).height(height);
        }
    };

    // Delay resize slightly to ensure container has rendered its dimensions
    setTimeout(resizeGlobe, 100);

    // Handle resize
    window.addEventListener('resize', resizeGlobe);
});
