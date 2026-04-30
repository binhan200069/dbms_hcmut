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
            freightCost: Number(values.freightCost),
            paymentTerm: values.paymentTerm
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
                        placeholder="Example: 12 Nguyen Hue, District 1, TP HCM"
                        {...register("pickupLocation", {
                            required: "Please enter pickup location",
                            validate: (value) =>
                                value.trim().length > 0 || "This field is required"
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
                        placeholder="Example: 101 Tran Hung Dao, Hoan Kiem, Ha Noi"
                        {...register("deliveryLocation", {
                            required: "Please enter delivery location",
                            validate: (value) =>
                                value.trim().length > 0 || "This field is required"
                        })}
                    />
                    {errors.deliveryLocation && (
                        <p className="field-error">{errors.deliveryLocation.message}</p>
                    )}
                </div>
                <div className="form-action-row">
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? "Dang tao..." : "Create Order"}
                    </button>
                </div>
            </form>
        </section>
    );
}

export default CreateOrderForm;
