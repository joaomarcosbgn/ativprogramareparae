"""Testes unitários (sem rede, só biblioteca padrão) da lógica Pix/Mercado Pago."""
import hashlib, hmac, unittest
import mercadopago_pix as mp


def assinar(segredo, data_id, req_id, ts):
    m = f"id:{data_id.lower()};request-id:{req_id};ts:{ts};"
    return f"ts={ts},v1=" + hmac.new(segredo.encode(), m.encode(), hashlib.sha256).hexdigest()


class Testes(unittest.TestCase):
    def test_centavos(self):
        self.assertEqual(mp.centavos(80), 8000)
        self.assertEqual(mp.centavos(0.1 + 0.2), 30)
        self.assertEqual(mp.centavos(19.9), 1990)
        self.assertEqual(mp.centavos(0), 0)

    def test_assinatura_valida(self):
        h = assinar("segredo", "ABC123", "req-1", "1700000000")
        self.assertTrue(mp.validar_assinatura("segredo", h, "req-1", "ABC123"))

    def test_assinatura_invalida(self):
        h = assinar("segredo", "123", "req-1", "1700000000")
        self.assertFalse(mp.validar_assinatura("outro", h, "req-1", "123"))
        self.assertFalse(mp.validar_assinatura("segredo", h, "req-2", "123"))
        self.assertFalse(mp.validar_assinatura("segredo", h, "req-1", "124"))
        self.assertFalse(mp.validar_assinatura("segredo", None, "req-1", "123"))
        self.assertFalse(mp.validar_assinatura("", h, "req-1", "123"))
        self.assertFalse(mp.validar_assinatura("segredo", "lixo", "req-1", "123"))

    def test_sem_token(self):
        import os
        os.environ.pop("MERCADOPAGO_ACCESS_TOKEN", None)
        with self.assertRaises(mp.MercadoPagoNaoConfigurado):
            mp.consultar_pagamento("123")

    def test_id_invalido(self):
        with self.assertRaises(mp.MercadoPagoErro):
            mp.consultar_pagamento("1/../x")

    def test_mapa_status(self):
        self.assertEqual(mp.MAPA_STATUS["approved"], "pago")
        self.assertEqual(mp.MAPA_STATUS["cancelled"], "expirado")


if __name__ == "__main__":
    unittest.main()
