import { useForm } from "react-hook-form";

function CreateOrderForm({ onSubmit }) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm({
        defaultValues: {
            pickupLocation: "",
            deliveryLocation: "",
            freightCost: ""
        }
    });

    async function submit(values) {
        const payload = {
            pickupLocation: values.pickupLocation.trim(),
            deliveryLocation: values.deliveryLocation.trim(),
            freightCost: Number(values.freightCost)
        };

        await onSubmit(payload);
        reset();
    }

    return (
        <section className="card section-gap">
            <h2 className="section-title">Create New Order</h2>

            <form onSubmit={handleSubmit(submit)} className="form-grid">
                <div>
                    <label className="field-label">Pickup Location</label>
                    <input
                        type="text"
                        className="field-input"
                        placeholder="Vi du: 12 Nguyen Hue, Quan 1, TP HCM"
                        {...register("pickupLocation", {
                            required: "Vui long nhap diem lay hang",
                            validate: (value) =>
                                value.trim().length > 0 || "Diem lay hang khong duoc de trong"
                        })}
                    />
                    {errors.pickupLocation && (
                        <p className="field-error">{errors.pickupLocation.message}</p>
                    )}
                </div>

                <div>
                    <label className="field-label">Delivery Location</label>
                    <input
                        type="text"
                        className="field-input"
                        placeholder="Vi du: 101 Tran Hung Dao, Hoan Kiem, Ha Noi"
                        {...register("deliveryLocation", {
                            required: "Vui long nhap diem giao hang",
                            validate: (value) =>
                                value.trim().length > 0 || "Diem giao hang khong duoc de trong"
                        })}
                    />
                    {errors.deliveryLocation && (
                        <p className="field-error">{errors.deliveryLocation.message}</p>
                    )}
                </div>

                <div>
                    <label className="field-label">Freight Cost (VND)</label>
                    <input
                        type="number"
                        min="1"
                        step="1000"
                        className="field-input"
                        placeholder="Nhap chi phi van chuyen"
                        {...register("freightCost", {
                            required: "Vui long nhap chi phi van chuyen",
                            valueAsNumber: true,
                            validate: (value) =>
                                value > 0 || "Chi phi van chuyen phai lon hon 0"
                        })}
                    />
                    {errors.freightCost && (
                        <p className="field-error">{errors.freightCost.message}</p>
                    )}
                </div>

                <div className="form-action-row">
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? "Dang tao..." : "Tao don hang"}
                    </button>
                </div>
            </form>
        </section>
    );
}

export default CreateOrderForm;
