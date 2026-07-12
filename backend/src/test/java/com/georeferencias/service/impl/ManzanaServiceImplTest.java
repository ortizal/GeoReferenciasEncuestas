package com.georeferencias.service.impl;

import com.georeferencias.dto.ManzanaDTO;
import com.georeferencias.entity.Manzana;
import com.georeferencias.repository.ManzanaRepository;
import com.georeferencias.repository.PredioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ManzanaServiceImplTest {

    @Mock
    private ManzanaRepository manzanaRepository;

    @Mock
    private PredioRepository predioRepository;

    @InjectMocks
    private ManzanaServiceImpl manzanaService;

    @Test
    void crear_deberiaAceptarGeoJsonVacioSinLanzarError() {
        ManzanaDTO dto = ManzanaDTO.builder()
                .claveCatastralManzana("MZ-001")
                .nombre("Manzana Test")
                .poligonoGeoJSON("   ")
                .build();

        when(manzanaRepository.existsByClaveCatastralManzana("MZ-001")).thenReturn(false);
        when(manzanaRepository.save(any(Manzana.class))).thenAnswer(invocation -> {
            Manzana manzana = invocation.getArgument(0);
            manzana.setIdManzana(1L);
            return manzana;
        });
        when(predioRepository.countByManzana(1L)).thenReturn(0L);

        ManzanaDTO resultado = manzanaService.crear(dto);

        assertThat(resultado.getClaveCatastralManzana()).isEqualTo("MZ-001");
        assertThat(resultado.getNombre()).isEqualTo("Manzana Test");
        verify(manzanaRepository).save(any(Manzana.class));
    }

    @Test
    void crear_deberiaAceptarCoordenadasComoPoligono() {
        ManzanaDTO dto = ManzanaDTO.builder()
                .claveCatastralManzana("MZ-002")
                .nombre("Manzana Coordenadas")
                .poligonoGeoJSON("[[-74.1,4.6],[-74.1,4.7],[-74.0,4.7],[-74.0,4.6],[-74.1,4.6]]")
                .build();

        when(manzanaRepository.existsByClaveCatastralManzana("MZ-002")).thenReturn(false);
        when(manzanaRepository.save(any(Manzana.class))).thenAnswer(invocation -> {
            Manzana manzana = invocation.getArgument(0);
            manzana.setIdManzana(2L);
            return manzana;
        });
        when(predioRepository.countByManzana(2L)).thenReturn(0L);

        manzanaService.crear(dto);

        ArgumentCaptor<Manzana> captor = ArgumentCaptor.forClass(Manzana.class);
        verify(manzanaRepository).save(captor.capture());
        assertThat(captor.getValue().getPoligono()).isNotNull();
    }
}
