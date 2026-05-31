from pydantic import BaseModel, Field, model_validator


class PlanoBase(BaseModel):
    nome: str = Field(..., min_length=1, max_length=80, examples=["UAU"])
    frequencia: str = Field(..., min_length=1, max_length=120, examples=["2x no mês (seg–qui)"])
    preco_corte: float = Field(..., gt=0, examples=[70.0])
    preco_corte_barba: float = Field(..., gt=0, examples=[119.0])
    desconto_extras: int = Field(default=0, ge=0, le=100, examples=[5])
    descricao: str | None = Field(default=None, max_length=500)
    ativo: bool = Field(default=True)

    @model_validator(mode="after")
    def _barba_nao_pode_ser_mais_barato(self):
        if self.preco_corte_barba < self.preco_corte:
            raise ValueError(
                "preco_corte_barba deve ser maior ou igual a preco_corte."
            )
        return self


class PlanoCreate(PlanoBase):
    pass


class PlanoOut(PlanoBase):
    id: str
